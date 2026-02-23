import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import Alert from '../../components/Alert'

export default function AdminProducts() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', description: '', price: '', stock_quantity: '', category_id: '', image_url: '' })
  const [error, setError] = useState('')

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => api.get('/products', { params: search ? { search } : {} }).then(r => r.data),
  })
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/products', { ...data, price: parseFloat(data.price), stock_quantity: parseInt(data.stock_quantity) || 0, category_id: data.category_id ? parseInt(data.category_id) : null }),
    onSuccess: () => { qc.invalidateQueries(['products']); setShowForm(false); setForm({ name: '', description: '', price: '', stock_quantity: '', category_id: '', image_url: '' }) },
    onError: (e) => setError(e.response?.data?.detail || 'Error creating product'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries(['products']),
  })

  const handleSubmit = (e) => { e.preventDefault(); setError(''); createMutation.mutate(form) }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Add Product</button>
      </div>

      <div className="flex">
        <input
          className="input-field max-w-sm"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">New Product</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="input-field" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">— Select —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                <input className="input-field" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input className="input-field" type="number" min="0" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input className="input-field" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
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
              <th className="table-header">Name</th>
              <th className="table-header">Category</th>
              <th className="table-header">Price</th>
              <th className="table-header">Stock</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 ? (
              <tr><td colSpan={6} className="table-cell text-center text-gray-400">No products found</td></tr>
            ) : products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="table-cell">{p.id}</td>
                <td className="table-cell font-medium">{p.name}</td>
                <td className="table-cell">{p.category_name || '—'}</td>
                <td className="table-cell">${Number(p.price).toFixed(2)}</td>
                <td className="table-cell">
                  <span className={p.stock_quantity === 0 ? 'text-red-600' : 'text-green-700'}>{p.stock_quantity}</span>
                </td>
                <td className="table-cell">
                  <button onClick={() => deleteMutation.mutate(p.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
