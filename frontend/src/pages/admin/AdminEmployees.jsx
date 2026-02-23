import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import Alert from '../../components/Alert'

export default function AdminEmployees() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', hire_date: '', salary: '', job_title: '', department_id: '', branch_id: '' })
  const [error, setError] = useState('')

  const { data: employees = [], isLoading } = useQuery({ queryKey: ['employees'], queryFn: () => api.get('/employees').then(r => r.data) })
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: () => api.get('/departments').then(r => r.data) })
  const { data: branches = [] } = useQuery({ queryKey: ['branches'], queryFn: () => api.get('/branches').then(r => r.data) })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/employees', {
      ...data,
      salary: data.salary ? parseFloat(data.salary) : null,
      department_id: data.department_id ? parseInt(data.department_id) : null,
      branch_id: data.branch_id ? parseInt(data.branch_id) : null,
    }),
    onSuccess: () => { qc.invalidateQueries(['employees']); setShowForm(false) },
    onError: (e) => setError(e.response?.data?.detail || 'Error creating employee'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/employees/${id}`),
    onSuccess: () => qc.invalidateQueries(['employees']),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Add Employee</button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">New Employee</h2>
          <form onSubmit={(e) => { e.preventDefault(); setError(''); createMutation.mutate(form) }} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input className="input-field" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input className="input-field" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input className="input-field" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date *</label>
                <input className="input-field" type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                <input className="input-field" type="number" step="0.01" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input className="input-field" value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select className="input-field" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                  <option value="">— Select —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <select className="input-field" value={form.branch_id} onChange={e => setForm({ ...form, branch_id: e.target.value })}>
                  <option value="">— Select —</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
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
              <th className="table-header">Email</th>
              <th className="table-header">Job Title</th>
              <th className="table-header">Salary</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.length === 0 ? (
              <tr><td colSpan={6} className="table-cell text-center text-gray-400">No employees found</td></tr>
            ) : employees.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="table-cell">{emp.id}</td>
                <td className="table-cell font-medium">{emp.first_name} {emp.last_name}</td>
                <td className="table-cell">{emp.email}</td>
                <td className="table-cell">{emp.job_title || '—'}</td>
                <td className="table-cell">{emp.salary ? `$${Number(emp.salary).toFixed(2)}` : '—'}</td>
                <td className="table-cell">
                  <button onClick={() => deleteMutation.mutate(emp.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
