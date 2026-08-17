import React, { createContext, useContext, useState, useEffect } from 'react'
import authApi from '../api/auth.api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dastak_customer_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState(() => {
    return localStorage.getItem('dastak_customer_token') || null
  })
  const [loading, setLoading] = useState(true)

  // Verify session on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('dastak_customer_token')
      if (savedToken) {
        try {
          const res = await authApi.getMe()
          if (res.data?.user) {
            setUser(res.data.user)
            localStorage.setItem('dastak_customer_user', JSON.stringify(res.data.user))
          }
        } catch (e) {
          console.warn('Session expired or invalid token')
          logout()
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (identifier, password) => {
    const res = await authApi.login(identifier, password)
    const authToken = res.data?.token
    const authUser = res.data?.user

    if (authToken && authUser) {
      setToken(authToken)
      setUser(authUser)
      localStorage.setItem('dastak_customer_token', authToken)
      localStorage.setItem('dastak_customer_user', JSON.stringify(authUser))
    }
    return res
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
    setToken(null)
  }

  const isAuthenticated = Boolean(token && user)

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default AuthContext
