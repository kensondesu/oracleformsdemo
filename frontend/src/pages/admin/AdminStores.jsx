import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import Alert from '../../components/Alert'

export default function AdminStores() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', branch_id: '', location: '', manager_id: '' })
  const [error, setError] = useState('')

  const { data: stores = [], isLoading } = useQuery({ queryKey: ['stores'], queryFn: () => api.get('/stores').then(r => r.data) })
  const { data: branches = [] } = useQuery({ queryKey: ['branches'], queryFn: () => api.get('/branches').then(r => r.data) })
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => api.get('/employees').then(r => r.data) })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/stores', {
      ...data,
      branch_id: data.branch_id ? parseInt(data.branch_id) : null,
      manager_id: data.manager_id ? parseInt(data.manager_id) : null,
    }),
    onSuccess: () => { qc.invalidateQueries(['stores']); setShowForm(false) },
    onError: (e) => setError(e.response?.data?.detail || 'Error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/stores/${id}`),
    onSuccess: () => qc.invalidateQueries(['stores']),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Add Store</button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">New Store</h2>
          <form onSubmit={(e) => { e.preventDefault(); setError(''); createMutation.mutate(form) }} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input className="input-field" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <select className="input-field" value={form.branch_id} onChange={e => setForm({ ...form, branch_id: e.target.value })}>
                  <option value="">— Select —</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                <select className="input-field" value={form.manager_id} onChange={e => setForm({ ...form, manager_id: e.target.value })}>
                  <option value="">— Select —</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
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
              <th className="table-header">Location</th>
              <th className="table-header">Branch ID</th>
              <th className="table-header">Manager ID</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stores.length === 0 ? (
              <tr><td colSpan={6} className="table-cell text-center text-gray-400">No stores found</td></tr>
            ) : stores.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="table-cell">{s.id}</td>
                <td className="table-cell font-medium">{s.name}</td>
                <td className="table-cell">{s.location || '—'}</td>
                <td className="table-cell">{s.branch_id || '—'}</td>
                <td className="table-cell">{s.manager_id || '—'}</td>
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
