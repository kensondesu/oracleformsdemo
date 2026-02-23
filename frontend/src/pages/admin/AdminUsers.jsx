import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import Alert from '../../components/Alert'

export default function AdminUsers() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', email: '', role: 'admin' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { data: users = [], isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: () => api.get('/users').then(r => r.data) })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/users', data),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); setShowForm(false); setSuccess('User created') },
    onError: (e) => setError(e.response?.data?.detail || 'Error creating user'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries(['admin-users']),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Add User</button>
      </div>

      <Alert type="success" message={success} />

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">New Admin User</h2>
          <form onSubmit={(e) => { e.preventDefault(); setError(''); createMutation.mutate(form) }} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input className="input-field" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input className="input-field" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input className="input-field" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
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
              <th className="table-header">Username</th>
              <th className="table-header">Email</th>
              <th className="table-header">Role</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="table-cell">{u.id}</td>
                <td className="table-cell font-medium">{u.username}</td>
                <td className="table-cell">{u.email}</td>
                <td className="table-cell">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'superadmin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="table-cell">
                  <button onClick={() => deleteMutation.mutate(u.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
