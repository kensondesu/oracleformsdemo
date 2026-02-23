import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../utils/api'
import Alert from '../../components/Alert'

export default function CustomerRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', first_name: '', last_name: '', email: '', phone: '', address: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/customers/register', form)
      navigate('/customer/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const field = (key, label, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      <input className="input-field" type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required={required} />
    </div>
  )

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-lg">
        <div className="card">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">👤</div>
            <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {field('first_name', 'First Name', 'text', true)}
              {field('last_name', 'Last Name', 'text', true)}
            </div>
            {field('username', 'Username', 'text', true)}
            {field('email', 'Email', 'email', true)}
            {field('password', 'Password', 'password', true)}
            {field('phone', 'Phone')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea className="input-field" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <Alert type="error" message={error} />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/customer/login" className="text-primary-600 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
