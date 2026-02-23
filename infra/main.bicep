@description('Base name for all resources')
param appName string = 'acmestore'

@description('Azure region')
param location string = resourceGroup().location

@description('PostgreSQL administrator password (used only for server management)')
@secure()
param dbAdminPassword string

@description('PostgreSQL application user password (used by the backend service)')
@secure()
param dbAppPassword string

@description('JWT secret key')
@secure()
param jwtSecret string

@description('Container registry name (must be globally unique)')
param registryName string = '${appName}acr'

// ── Container Registry ────────────────────────────────────────────────────────
// Admin user disabled; image pulls use a Managed Identity with AcrPull role.
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: registryName
  location: location
  sku: { name: 'Basic' }
  properties: { adminUserEnabled: false }
}

// ── User-assigned Managed Identity (for AcrPull) ──────────────────────────────
resource acrPullIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${appName}-aca-identity'
  location: location
}

// Built-in AcrPull role definition ID
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'

resource acrPullAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, acrPullIdentity.id, acrPullRoleId)
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalId: acrPullIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── Virtual Network ───────────────────────────────────────────────────────────
// Container Apps and PostgreSQL are kept on a private VNet; no public DB firewall.
resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: '${appName}-vnet'
  location: location
  properties: {
    addressSpace: { addressPrefixes: ['10.0.0.0/16'] }
    subnets: [
      {
        // /23 is the minimum required for Container Apps infrastructure subnet
        name: 'container-apps'
        properties: {
          addressPrefix: '10.0.0.0/23'
          delegations: [
            {
              name: 'aca-delegation'
              properties: { serviceName: 'Microsoft.App/environments' }
            }
          ]
        }
      }
      {
        name: 'postgres'
        properties: {
          addressPrefix: '10.0.2.0/28'
          delegations: [
            {
              name: 'pg-delegation'
              properties: { serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers' }
            }
          ]
        }
      }
    ]
  }
}

// ── Private DNS Zone for PostgreSQL ──────────────────────────────────────────
resource postgresDns 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: '${appName}-pg.private.postgres.database.azure.com'
  location: 'global'
}

resource postgresDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: postgresDns
  name: '${appName}-dns-vnet-link'
  location: 'global'
  properties: {
    virtualNetwork: { id: vnet.id }
    registrationEnabled: false
  }
}

// ── Log Analytics ─────────────────────────────────────────────────────────────
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${appName}-logs'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

// ── Container Apps Environment (VNet-integrated) ──────────────────────────────
resource cae 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${appName}-env'
  location: location
  properties: {
    vnetConfiguration: {
      infrastructureSubnetId: vnet.properties.subnets[0].id
      internal: false
    }
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ── PostgreSQL Flexible Server (private VNet access – no public firewall rule) ─
// NOTE: After provisioning, create a dedicated least-privilege app user:
//   CREATE USER acmeapp WITH PASSWORD '<dbAppPassword>';
//   GRANT CONNECT ON DATABASE acmedb TO acmeapp;
//   GRANT USAGE ON SCHEMA public TO acmeapp;
//   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO acmeapp;
//   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO acmeapp;
resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: '${appName}-postgres'
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: 'pgadmin'
    administratorLoginPassword: dbAdminPassword
    storage: { storageSizeGB: 32 }
    version: '16'
    backup: { backupRetentionDays: 7, geoRedundantBackup: 'Disabled' }
    highAvailability: { mode: 'Disabled' }
    network: {
      delegatedSubnetResourceId: vnet.properties.subnets[1].id
      privateDnsZoneArmResourceId: postgresDns.id
    }
  }
  dependsOn: [postgresDnsLink]
}

resource postgresDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: postgres
  name: 'acmedb'
}

// ── Backend Container App ─────────────────────────────────────────────────────
resource backendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${appName}-backend'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${acrPullIdentity.id}': {} }
  }
  properties: {
    managedEnvironmentId: cae.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8000
        transport: 'http'
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: acrPullIdentity.id
        }
      ]
      secrets: [
        // App connects with the dedicated least-privilege 'acmeapp' user, not pgadmin
        { name: 'database-url', value: 'postgresql+asyncpg://acmeapp:${dbAppPassword}@${postgres.properties.fullyQualifiedDomainName}:5432/acmedb' }
        { name: 'jwt-secret', value: jwtSecret }
      ]
    }
    template: {
      containers: [
        {
          name: 'backend'
          image: '${acr.properties.loginServer}/${appName}-backend:latest'
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: [
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'SECRET_KEY', secretRef: 'jwt-secret' }
            { name: 'CORS_ORIGINS', value: '["https://${appName}-frontend.${cae.properties.defaultDomain}"]' }
          ]
        }
      ]
      scale: { minReplicas: 1, maxReplicas: 3 }
    }
  }
}

// ── Frontend Container App ────────────────────────────────────────────────────
resource frontendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${appName}-frontend'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${acrPullIdentity.id}': {} }
  }
  properties: {
    managedEnvironmentId: cae.id
    configuration: {
      ingress: {
        external: true
        targetPort: 80
        transport: 'http'
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: acrPullIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'frontend'
          image: '${acr.properties.loginServer}/${appName}-frontend:latest'
          resources: { cpu: json('0.25'), memory: '0.5Gi' }
          env: [
            // Internal Container Apps DNS name for the backend service
            { name: 'BACKEND_HOST', value: '${appName}-backend' }
          ]
        }
      ]
      scale: { minReplicas: 1, maxReplicas: 3 }
    }
  }
}

// ── Outputs ───────────────────────────────────────────────────────────────────
output frontendUrl string = 'https://${frontendApp.properties.configuration.ingress.fqdn}'
output backendUrl string = 'https://${backendApp.properties.configuration.ingress.fqdn}'
output acrLoginServer string = acr.properties.loginServer
