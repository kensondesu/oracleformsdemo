# ACME Store – Modernized Web Application

Modernized from Oracle WebForms + Oracle DB to a full-stack web application:

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python 3.12 + FastAPI + SQLAlchemy (async) |
| Database | PostgreSQL 16 |
| Deployment | Azure Container Apps |

---

## Features

### Customer Portal
- Register / login
- Browse & search products by name or category
- Add to cart and place orders
- View order history and status

### Admin Portal
- Dashboard with key metrics (products, orders, customers, employees)
- Manage **Products** (CRUD, categories, discounts)
- Manage **Orders** (list, update status)
- Manage **Customers** (view info and orders)
- Manage **Employees** (CRUD, departments)
- Manage **Branches** (CRUD)
- Manage **Stores** (CRUD, inventory)
- Manage **Supply** records
- Manage **Admin Users** (create, delete)

---

## Project Structure

```
.
├── backend/               # FastAPI Python app
│   ├── app/
│   │   ├── main.py       # App factory + lifespan
│   │   ├── config.py     # Settings (env-based)
│   │   ├── database.py   # Async SQLAlchemy engine
│   │   ├── models/       # ORM models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── routers/      # API route handlers
│   │   └── utils/        # JWT / password helpers
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/              # React + Vite + Tailwind app
│   ├── src/
│   │   ├── App.jsx       # Router + auth guards
│   │   ├── pages/        # Admin & customer pages
│   │   ├── components/   # Shared UI components
│   │   ├── hooks/        # useAuth context
│   │   └── utils/        # Axios client
│   ├── nginx.conf        # Nginx reverse-proxy config
│   └── Dockerfile
├── database/
│   └── init.sql          # PostgreSQL schema + seed data
├── infra/
│   ├── main.bicep        # Azure Container Apps infrastructure
│   └── parameters.json   # Deployment parameters template
├── .github/workflows/
│   └── deploy.yml        # CI/CD pipeline
└── docker-compose.yml    # Local development stack
```

---

## Local Development

### Prerequisites
- Docker & Docker Compose

### Run

```bash
docker compose up --build
```

Then open:
- **Frontend**: http://localhost:80
- **Backend API docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432 (user: `postgres`, pass: `postgres`, db: `acmedb`)

**Default admin credentials**: `admin` / `admin123`

---

## Azure Deployment

### 1. Create Azure resources

```bash
az login
az group create --name acmestore-rg --location eastus

# Store secrets in Key Vault (recommended)
az keyvault create --name acmestore-kv -g acmestore-rg
az keyvault secret set --vault-name acmestore-kv --name db-admin-password --value '<strong-admin-password>'
az keyvault secret set --vault-name acmestore-kv --name db-app-password --value '<strong-app-password>'
az keyvault secret set --vault-name acmestore-kv --name jwt-secret --value '<random-64-char-string>'

# Deploy infrastructure (secrets are pulled from Key Vault via parameters.json references)
az deployment group create \
  --resource-group acmestore-rg \
  --template-file infra/main.bicep \
  --parameters infra/parameters.json
```

### 2. Push images to ACR

```bash
ACR=$(az acr show -g acmestore-rg -n acmestoreacr --query loginServer -o tsv)
# ACR admin user is disabled; authenticate via Azure AD (service principal / managed identity)
az acr login --name acmestoreacr

docker build -t $ACR/acmestore-backend:latest ./backend
docker build -t $ACR/acmestore-frontend:latest ./frontend
docker push $ACR/acmestore-backend:latest
docker push $ACR/acmestore-frontend:latest
```

### 3. Configure GitHub Actions secrets

| Secret | Description |
|--------|-------------|
| `AZURE_CREDENTIALS` | JSON output of `az ad sp create-for-rbac` (also used for ACR auth) |
| `ACR_LOGIN_SERVER` | e.g. `acmestoreacr.azurecr.io` |

After setting the secrets, push to `main` to trigger the CI/CD pipeline.

---

## API Reference

Interactive docs are available at `/docs` (Swagger UI) and `/redoc` when the backend is running.

### Key endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/admin/login` | Admin login |
| POST | `/api/auth/customer/login` | Customer login |
| GET | `/api/products` | List products (public) |
| POST | `/api/customers/register` | Register a new customer |
| POST | `/api/orders` | Place an order (customer auth) |
| GET | `/api/orders/me/orders` | Customer's own orders |
| PATCH | `/api/orders/{id}/status` | Update order status (admin auth) |

---

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@db:5432/acmedb` | PostgreSQL connection string |
| `SECRET_KEY` | *(must be set)* | JWT signing secret |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | Token TTL (8 hours) |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins |
