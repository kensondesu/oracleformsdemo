import { useQuery } from '@tanstack/react-query'
import api from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function MyOrders() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/me/orders').then(r => r.data),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>

      {orders.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg">You haven't placed any orders yet.</p>
          <a href="/shop" className="btn-primary inline-block mt-4">Start Shopping</a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold">Order #{order.id}</h2>
                  <p className="text-sm text-gray-500">{order.order_date ? new Date(order.order_date).toLocaleDateString() : ''}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                    {order.status}
                  </span>
                  <p className="text-lg font-bold mt-1">${Number(order.total_amount || 0).toFixed(2)}</p>
                </div>
              </div>

              {order.items?.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Items</p>
                  <div className="space-y-1">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product_name || `Product #${item.product_id}`} × {item.quantity}</span>
                        <span>${(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {order.shipping_address && (
                <p className="text-xs text-gray-400 mt-3">📍 {order.shipping_address}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
