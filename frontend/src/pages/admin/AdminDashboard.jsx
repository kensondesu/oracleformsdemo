import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function AdminDashboard() {
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => api.get('/products').then(r => r.data) })
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: () => api.get('/orders').then(r => r.data) })
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => api.get('/customers').then(r => r.data) })
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => api.get('/employees').then(r => r.data) })

  const stats = [
    { label: 'Products', value: products.length, icon: '📦', to: '/admin/products', color: 'bg-blue-500' },
    { label: 'Orders', value: orders.length, icon: '🛒', to: '/admin/orders', color: 'bg-green-500' },
    { label: 'Customers', value: customers.length, icon: '👥', to: '/admin/customers', color: 'bg-purple-500' },
    { label: 'Employees', value: employees.length, icon: '👤', to: '/admin/employees', color: 'bg-orange-500' },
  ]

  const recentOrders = orders.slice(0, 5)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className={`${stat.color} text-white rounded-lg p-3 text-2xl`}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Branches', icon: '🏢', to: '/admin/branches' },
          { label: 'Stores', icon: '🏪', to: '/admin/stores' },
          { label: 'Supply', icon: '🚚', to: '/admin/supply' },
          { label: 'Users', icon: '🔑', to: '/admin/users' },
        ].map((l) => (
          <Link key={l.label} to={l.to} className="card hover:shadow-md transition-shadow text-center">
            <div className="text-3xl mb-2">{l.icon}</div>
            <div className="text-sm font-medium text-gray-700">{l.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-sm">No orders yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Order #</th>
                <th className="table-header">Customer ID</th>
                <th className="table-header">Status</th>
                <th className="table-header">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="table-cell font-mono">#{order.id}</td>
                  <td className="table-cell">{order.customer_id}</td>
                  <td className="table-cell">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="table-cell">${Number(order.total_amount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  )
}
