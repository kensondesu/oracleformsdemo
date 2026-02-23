import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Home() {
  const { role } = useAuth()

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center py-16 bg-gradient-to-br from-primary-900 to-primary-700 rounded-2xl text-white">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Welcome to ACME Store</h1>
        <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
          Your one-stop shop for everything. Browse our catalog, place orders, and track deliveries — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/shop" className="bg-white text-primary-700 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition-colors">
            Browse Products
          </Link>
          {!role && (
            <Link to="/customer/register" className="border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition-colors">
              Create Account
            </Link>
          )}
        </div>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: '📦', title: 'Wide Selection', desc: 'Thousands of products across multiple categories.' },
          { icon: '🚚', title: 'Fast Delivery', desc: 'Reliable shipping from multiple branch locations.' },
          { icon: '🔒', title: 'Secure Ordering', desc: 'Your data and payments are always protected.' },
        ].map(f => (
          <div key={f.title} className="card text-center">
            <div className="text-4xl mb-3">{f.icon}</div>
            <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-gray-500 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Panel quick access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-gradient-to-br from-primary-50 to-white border-primary-100">
          <h2 className="text-xl font-bold mb-2">Customer Portal</h2>
          <p className="text-gray-500 text-sm mb-4">Shop, track orders, and manage your account.</p>
          <div className="flex gap-3">
            <Link to="/customer/login" className="btn-primary">Sign In</Link>
            <Link to="/customer/register" className="btn-secondary">Register</Link>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-gray-50 to-white border-gray-100">
          <h2 className="text-xl font-bold mb-2">Admin Portal</h2>
          <p className="text-gray-500 text-sm mb-4">Manage products, orders, employees and more.</p>
          <Link to="/login" className="btn-secondary">Admin Login</Link>
        </div>
      </div>
    </div>
  )
}
