import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

const AUTH_KEYS = ['token', 'role', 'userId', 'username']

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      AUTH_KEYS.forEach((key) => localStorage.removeItem(key))
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

export default api
