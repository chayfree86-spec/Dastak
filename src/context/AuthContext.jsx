import React, { createContext, useContext, useState, useEffect } from 'react'
import authApi from '../api/auth.api'
import { ROLES, hasPermission } from '../utils/permissions'

const AuthContext = createContext()

// DEV BYPASS: login screen is skipped while in "production preview" mode, but the
// backend /admin routes stay Sanctum-protected. This is the real seeded Super Admin
// token (see backend AdminBypassTokenSeeder::BYPASS_TOKEN) so bypassed requests still
// authenticate. Remove and wire real login before a production launch.
const BYPASS_TOKEN = 'dastak-admin-master-bypass-token-2026'

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('dastak_admin_token') || BYPASS_TOKEN)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dastak_admin_user')
    return saved ? JSON.parse(saved) : {
      id: 1,
      name: 'Sandeep Sharma',
      email: 'admin@dastakdelivery.com',
      role: ROLES.SUPER_ADMIN,
    }
  })
  const [loading, setLoading] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Persist the bypass token so the axios interceptor (which reads localStorage)
  // attaches a valid Authorization header on every request while login is skipped.
  useEffect(() => {
    if (!localStorage.getItem('dastak_admin_token')) {
      localStorage.setItem('dastak_admin_token', BYPASS_TOKEN)
    }
  }, [])

  const login = async (credentials) => {
    try {
      const response = await authApi.login(credentials)
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
      throw new Error(response?.message || 'Login failed: Invalid server response')
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
