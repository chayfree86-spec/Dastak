import React, { createContext, useContext, useState, useEffect } from 'react'
import authApi from '../api/auth.api'
import { ROLES, hasPermission } from '../utils/permissions'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('dastak_admin_token'))

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dastak_admin_user')
    return saved ? JSON.parse(saved) : null
  })

  const [loading, setLoading] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    if (token && !localStorage.getItem('dastak_admin_token')) {
      localStorage.setItem('dastak_admin_token', token)
    }
  }, [token])

  const login = async (credentials) => {
    try {
      const response = await authApi.login({
        identifier: credentials.login || credentials.email || credentials.identifier,
        password: credentials.password,
      })
      const authToken = response?.data?.token || response?.token
      const userData = response?.data?.user || response?.user

      if (authToken && userData) {
        localStorage.setItem('dastak_admin_token', authToken)
        localStorage.setItem('dastak_admin_user', JSON.stringify(userData))
        setToken(authToken)
        setUser(userData)
        setSessionExpired(false)
        return { success: true, user: userData }
      }
      throw new Error('Login failed: Invalid credentials.')
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout().catch(() => {})
      }
    } finally {
      localStorage.removeItem('dastak_admin_token')
      localStorage.removeItem('dastak_admin_user')
      setToken(null)
      setUser(null)
    }
  }

  const checkPermission = (moduleKey) => {
    return hasPermission(user?.role, moduleKey)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role: user?.role || ROLES.SUPER_ADMIN,
        isAuthenticated: !!token && !!user,
        loading,
        sessionExpired,
        setSessionExpired,
        login,
        logout,
        checkPermission,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export default AuthContext
