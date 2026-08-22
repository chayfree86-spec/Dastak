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
  const [sessionToken, setSessionToken] = useState(() => {
    return localStorage.getItem('dastak_customer_session_token') || null
  })
  const [loading, setLoading] = useState(() => {
    return Boolean(localStorage.getItem('dastak_customer_session_token') || localStorage.getItem('dastak_customer_token'))
  })

  // Verify permanent device session on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedSessionToken = localStorage.getItem('dastak_customer_session_token')
      const savedAuthToken = localStorage.getItem('dastak_customer_token')

      if (savedSessionToken) {
        try {
          const res = await authApi.validateSession(savedSessionToken)
          const userData = res.data?.user || res.data?.data?.user || res.data
          if (userData && userData.id) {
            setUser(userData)
            localStorage.setItem('dastak_customer_user', JSON.stringify(userData))
          }
        } catch (e) {
          console.warn('Permanent session check failed / session revoked:', e)
          // Session was revoked or moved to another device
          await clearSession()
        }
      } else if (savedAuthToken) {
        try {
          const res = await authApi.getMe()
          const userData = res.data?.data || res.data?.user || res.data
          if (userData && userData.id) {
            setUser(userData)
            localStorage.setItem('dastak_customer_user', JSON.stringify(userData))
          }
        } catch (e) {
          await clearSession()
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const startVerification = async (mobile) => {
    const res = await authApi.startVerification(mobile)
    return res
  }

  const resendOtp = async (sessionId) => {
    const res = await authApi.resendOtp(sessionId)
    return res
  }

  const verifyDeviceOtp = async (sessionId, otp, name = null, pin = null) => {
    const res = await authApi.verifyOtp(sessionId, otp, name, pin)
    const authToken = res.data?.token || res.data?.data?.token
    const rawSessionToken = res.data?.session_token || res.data?.data?.session_token
    const authUser = res.data?.user || res.data?.data?.user
    const isNewUser = res.data?.is_new_user ?? res.data?.data?.is_new_user

    if (!authToken || !authUser) {
      throw new Error('Invalid response from server.')
    }

    setToken(authToken)
    if (rawSessionToken) {
      setSessionToken(rawSessionToken)
      localStorage.setItem('dastak_customer_session_token', rawSessionToken)
    }
    setUser(authUser)
    localStorage.setItem('dastak_customer_token', authToken)
    localStorage.setItem('dastak_customer_user', JSON.stringify(authUser))

    return {
      token: authToken,
      sessionToken: rawSessionToken,
      user: authUser,
      isNewUser: Boolean(isNewUser),
      response: res,
    }
  }

  const verifyDevicePin = async (sessionId, pin) => {
    const res = await authApi.verifyPin(sessionId, pin)
    const authToken = res.data?.token || res.data?.data?.token
    const rawSessionToken = res.data?.session_token || res.data?.data?.session_token
    const authUser = res.data?.user || res.data?.data?.user

    if (!authToken || !authUser) {
      throw new Error('Invalid response from server.')
    }

    setToken(authToken)
    if (rawSessionToken) {
      setSessionToken(rawSessionToken)
      localStorage.setItem('dastak_customer_session_token', rawSessionToken)
    }
    setUser(authUser)
    localStorage.setItem('dastak_customer_token', authToken)
    localStorage.setItem('dastak_customer_user', JSON.stringify(authUser))

    return {
      token: authToken,
      sessionToken: rawSessionToken,
      user: authUser,
      isNewUser: false,
      response: res,
    }
  }

  const changeDevice = async () => {
    try {
      await authApi.changeDevice()
    } catch (e) {
      console.warn('Change device API warning:', e)
    } finally {
      await clearSession()
    }
  }

  const clearSession = async () => {
    localStorage.removeItem('dastak_customer_token')
    localStorage.removeItem('dastak_customer_session_token')
    localStorage.removeItem('dastak_customer_user')
    setUser(null)
    setToken(null)
    setSessionToken(null)
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      console.warn('Logout API error:', e)
    } finally {
      await clearSession()
    }
  }

  const updateSessionUser = (updatedUserData) => {
    setUser(updatedUserData)
    localStorage.setItem('dastak_customer_user', JSON.stringify(updatedUserData))
  }

  const isAuthenticated = Boolean((token || sessionToken) && user)

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        sessionToken,
        loading,
        isAuthenticated,
        startVerification,
        resendOtp,
        verifyDeviceOtp,
        verifyDevicePin,
        changeDevice,
        updateSessionUser,
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
