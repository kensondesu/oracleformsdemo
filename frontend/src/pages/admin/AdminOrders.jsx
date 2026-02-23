import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import Alert from '../../components/Alert'

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function AdminOrders() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState(null)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then(r => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries(['orders']); setSelected(null) },
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

      {selected && (
        <div className="card border-primary-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Order #{selected.id} – Update Status</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close order details" title="Close order details">✕</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => statusMutation.mutate({ id: selected.id, status: s })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${selected.status === s ? 'ring-2 ring-primary-500' : ''} ${STATUS_COLORS[s] || 'bg-gray-100'}`}
              >
                {s}
              </button>
            ))}
          </div>
          {selected.items?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Items</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Product</th>
                    <th className="table-header">Qty</th>
                    <th className="table-header">Price</th>
                    <th className="table-header">Discount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selected.items.map(item => (
                    <tr key={item.id}>
                      <td className="table-cell">{item.product_name || item.product_id}</td>
                      <td className="table-cell">{item.quantity}</td>
                      <td className="table-cell">${Number(item.unit_price).toFixed(2)}</td>
                      <td className="table-cell">{item.discount_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-header">Order #</th>
              <th className="table-header">Customer</th>
              <th className="table-header">Date</th>
              <th className="table-header">Status</th>
              <th className="table-header">Total</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr><td colSpan={6} className="table-cell text-center text-gray-400">No orders found</td></tr>
            ) : orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono">#{o.id}</td>
                <td className="table-cell">{o.customer_id}</td>
                <td className="table-cell">{o.order_date ? new Date(o.order_date).toLocaleDateString() : '—'}</td>
                <td className="table-cell">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-800'}`}>
                    {o.status}
                  </span>
                </td>
                <td className="table-cell">${Number(o.total_amount || 0).toFixed(2)}</td>
                <td className="table-cell">
                  <button onClick={() => setSelected(o)} className="text-primary-600 hover:text-primary-800 text-sm">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
