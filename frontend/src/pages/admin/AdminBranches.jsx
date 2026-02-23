import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import Alert from '../../components/Alert'

export default function AdminBranches() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', location: '', phone: '' })
  const [error, setError] = useState('')

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/branches', data),
    onSuccess: () => { qc.invalidateQueries(['branches']); setShowForm(false); setForm({ name: '', location: '', phone: '' }) },
    onError: (e) => setError(e.response?.data?.detail || 'Error creating branch'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/branches/${id}`),
    onSuccess: () => qc.invalidateQueries(['branches']),
  })

  const handleSubmit = (e) => { e.preventDefault(); setError(''); createMutation.mutate(form) }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Add Branch</button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">New Branch</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input className="input-field" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
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
              <th className="table-header">Phone</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {branches.length === 0 ? (
              <tr><td colSpan={5} className="table-cell text-center text-gray-400">No branches found</td></tr>
            ) : branches.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="table-cell">{b.id}</td>
                <td className="table-cell font-medium">{b.name}</td>
                <td className="table-cell">{b.location || '—'}</td>
                <td className="table-cell">{b.phone || '—'}</td>
                <td className="table-cell">
                  <button onClick={() => deleteMutation.mutate(b.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
