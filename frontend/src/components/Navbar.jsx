import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { role, username, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-primary-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold tracking-wide">
              🏪 ACME Store
            </Link>
            {role === 'customer' && (
              <div className="hidden md:flex space-x-4">
                <Link to="/shop" className="hover:text-primary-200 transition-colors text-sm">Products</Link>
                <Link to="/my-orders" className="hover:text-primary-200 transition-colors text-sm">My Orders</Link>
              </div>
            )}
            {(role === 'admin' || role === 'superadmin') && (
              <div className="hidden md:flex space-x-4">
                <Link to="/admin" className="hover:text-primary-200 transition-colors text-sm">Dashboard</Link>
                <Link to="/admin/products" className="hover:text-primary-200 transition-colors text-sm">Products</Link>
                <Link to="/admin/orders" className="hover:text-primary-200 transition-colors text-sm">Orders</Link>
                <Link to="/admin/customers" className="hover:text-primary-200 transition-colors text-sm">Customers</Link>
                <Link to="/admin/employees" className="hover:text-primary-200 transition-colors text-sm">Employees</Link>
                <Link to="/admin/branches" className="hover:text-primary-200 transition-colors text-sm">Branches</Link>
                <Link to="/admin/stores" className="hover:text-primary-200 transition-colors text-sm">Stores</Link>
                <Link to="/admin/supply" className="hover:text-primary-200 transition-colors text-sm">Supply</Link>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {username ? (
              <>
                <span className="text-sm text-primary-200">👤 {username}</span>
                <button onClick={handleLogout} className="btn-secondary text-sm !text-gray-700">Logout</button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login" className="btn-secondary text-sm !text-gray-700">Admin Login</Link>
                <Link to="/customer/login" className="btn-primary text-sm">Customer Login</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
