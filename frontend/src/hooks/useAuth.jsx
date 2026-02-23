import { createContext, useContext, useState } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [role, setRole] = useState(() => localStorage.getItem('role'))
  const [userId, setUserId] = useState(() => localStorage.getItem('userId'))
  const [username, setUsername] = useState(() => localStorage.getItem('username'))

  const login = (data) => {
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('role', data.role)
    localStorage.setItem('userId', data.user_id)
    localStorage.setItem('username', data.username)
    setToken(data.access_token)
    setRole(data.role)
    setUserId(data.user_id)
    setUsername(data.username)
  }

  const logout = () => {
    localStorage.clear()
    setToken(null)
    setRole(null)
    setUserId(null)
    setUsername(null)
  }

  return (
    <AuthContext.Provider value={{ token, role, userId, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
