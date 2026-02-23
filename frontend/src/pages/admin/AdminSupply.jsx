import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import Alert from '../../components/Alert'

export default function AdminSupply() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ product_id: '', store_id: '', quantity: '', supply_date: '', supplier_name: '' })
  const [error, setError] = useState('')

  const { data: supply = [], isLoading } = useQuery({ queryKey: ['supply'], queryFn: () => api.get('/supply').then(r => r.data) })
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => api.get('/products').then(r => r.data) })
  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: () => api.get('/stores').then(r => r.data) })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/supply', {
      ...data,
      product_id: parseInt(data.product_id),
      store_id: parseInt(data.store_id),
      quantity: parseInt(data.quantity),
    }),
    onSuccess: () => { qc.invalidateQueries(['supply']); setShowForm(false) },
    onError: (e) => setError(e.response?.data?.detail || 'Error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/supply/${id}`),
    onSuccess: () => qc.invalidateQueries(['supply']),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Supply Records</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Add Supply</button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">New Supply Record</h2>
          <form onSubmit={(e) => { e.preventDefault(); setError(''); createMutation.mutate(form) }} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                <select className="input-field" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} required>
                  <option value="">— Select —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store *</label>
                <select className="input-field" value={form.store_id} onChange={e => setForm({ ...form, store_id: e.target.value })} required>
                  <option value="">— Select —</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input className="input-field" type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supply Date *</label>
                <input className="input-field" type="date" value={form.supply_date} onChange={e => setForm({ ...form, supply_date: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                <input className="input-field" value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })} />
              </div>
            </div>
            <Alert type="error" message={error} />
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary" disabled={createMutation.isPending}>Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-header">ID</th>
              <th className="table-header">Product ID</th>
              <th className="table-header">Store ID</th>
              <th className="table-header">Quantity</th>
              <th className="table-header">Date</th>
              <th className="table-header">Supplier</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {supply.length === 0 ? (
              <tr><td colSpan={7} className="table-cell text-center text-gray-400">No supply records found</td></tr>
            ) : supply.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="table-cell">{s.id}</td>
                <td className="table-cell">{s.product_id}</td>
                <td className="table-cell">{s.store_id}</td>
                <td className="table-cell">{s.quantity}</td>
                <td className="table-cell">{s.supply_date}</td>
                <td className="table-cell">{s.supplier_name || '—'}</td>
                <td className="table-cell">
                  <button onClick={() => deleteMutation.mutate(s.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
