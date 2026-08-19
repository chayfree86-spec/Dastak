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
          const userData = res.data?.data || res.data?.user || res.data
          if (userData && userData.id) {
            const role = userData.role || (userData.roles && userData.roles[0]?.slug)
            if (role && role !== 'customer') {
              console.warn('Non-customer role detected in customer app session, clearing...')
              logout()
            } else {
              setUser(userData)
              localStorage.setItem('dastak_customer_user', JSON.stringify(userData))
            }
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
    const authToken = res.data?.token || res.data?.data?.token
    const authUser = res.data?.user || res.data?.data?.user

    if (!authToken || !authUser) {
      throw new Error('Invalid response from server.')
    }

    // Role check: Only customer role is allowed in Customer App
    const role = authUser.role || (authUser.roles && authUser.roles[0]?.slug)
    if (role && role !== 'customer') {
      const roleName = role === 'restaurant_owner' 
        ? 'Restaurant Partner' 
        : role === 'delivery_boy' 
        ? 'Delivery Rider' 
        : 'Admin'
      throw new Error(`This mobile number is registered as a ${roleName} account. Please use a Customer mobile number, or log into the Partner/Admin portal.`)
    }

    setToken(authToken)
    setUser(authUser)
    localStorage.setItem('dastak_customer_token', authToken)
    localStorage.setItem('dastak_customer_user', JSON.stringify(authUser))
    return res
  }

  const register = async ({ name, mobile, password, email }) => {
    const res = await authApi.register({ name, mobile, password, email })
    const authToken = res.data?.token || res.data?.data?.token
    const authUser = res.data?.user || res.data?.data?.user

    if (!authToken || !authUser) {
      throw new Error('Invalid response from server.')
    }

    setToken(authToken)
    setUser(authUser)
    localStorage.setItem('dastak_customer_token', authToken)
    localStorage.setItem('dastak_customer_user', JSON.stringify(authUser))
    return res
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      console.warn('Logout API error:', e)
    } finally {
      localStorage.removeItem('dastak_customer_token')
      localStorage.removeItem('dastak_customer_user')
      setUser(null)
      setToken(null)
    }
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
        register,
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
