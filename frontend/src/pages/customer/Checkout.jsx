import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import Alert from '../../components/Alert'

export default function Checkout() {
  const location = useLocation()
  const navigate = useNavigate()
  const cart = location.state?.cart || []
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        shipping_address: address,
        items: cart.map(i => ({
          product_id: i.id,
          quantity: i.qty,
          unit_price: Number(i.price),
          discount_pct: 0,
        })),
      }
      await api.post('/orders', payload)
      navigate('/my-orders')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Your cart is empty. <a href="/shop" className="text-primary-600 hover:underline">Continue shopping</a></p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
        <div className="divide-y divide-gray-100">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between py-2 text-sm">
              <span>{item.name} × {item.qty}</span>
              <span>${(Number(item.price) * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-4 mt-2 border-t border-gray-200 font-bold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Shipping Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address *</label>
            <textarea
              className="input-field"
              rows={3}
              value={address}
              onChange={e => setAddress(e.target.value)}
              required
              placeholder="Enter your delivery address…"
            />
          </div>
          <Alert type="error" message={error} />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Placing order…' : `Place Order – $${total.toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  )
}
