import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function Shop() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search, categoryId],
    queryFn: () => api.get('/products', { params: { ...(search && { search }), ...(categoryId && { category_id: categoryId }) } }).then(r => r.data),
  })
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  })

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id))

  const cartTotal = cart.reduce((sum, i) => sum + Number(i.price) * i.qty, 0)

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button onClick={() => setShowCart(!showCart)} className="relative btn-secondary">
          🛒 Cart
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cart.reduce((s, i) => s + i.qty, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Cart panel */}
      {showCart && (
        <div className="card border-primary-200">
          <h2 className="text-lg font-semibold mb-3">Your Cart</h2>
          {cart.length === 0 ? <p className="text-gray-400 text-sm">Cart is empty</p> : (
            <>
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm">{item.name} × {item.qty}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium">${(Number(item.price) * item.qty).toFixed(2)}</span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 text-xs"
                      aria-label={`Remove ${item.name} from cart`}
                      title={`Remove ${item.name} from cart`}
                    >✕</button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 mt-2">
                <span className="font-semibold">Total: ${cartTotal.toFixed(2)}</span>
                <Link
                  to="/checkout"
                  state={{ cart }}
                  className="btn-primary"
                >
                  Checkout
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input className="input-field max-w-xs" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input-field max-w-xs" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.length === 0 ? (
          <p className="text-gray-400 col-span-4 text-center py-8">No products found</p>
        ) : products.map(p => (
          <div key={p.id} className="card hover:shadow-md transition-shadow">
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover rounded-lg mb-3" />
            ) : (
              <div className="w-full h-40 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-4xl">📦</div>
            )}
            <h3 className="font-semibold text-gray-900 text-sm mb-1">{p.name}</h3>
            {p.category_name && <p className="text-xs text-gray-400 mb-2">{p.category_name}</p>}
            {p.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.description}</p>}
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-primary-600">${Number(p.price).toFixed(2)}</span>
              <button
                onClick={() => addToCart(p)}
                disabled={p.stock_quantity === 0}
                className={p.stock_quantity === 0 ? 'text-gray-300 text-sm cursor-not-allowed' : 'btn-primary text-sm'}
              >
                {p.stock_quantity === 0 ? 'Out of stock' : 'Add to cart'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
