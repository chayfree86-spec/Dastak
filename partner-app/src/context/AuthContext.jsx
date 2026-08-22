import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import authApi from '../api/auth.api'
import restaurantApi from '../api/restaurant.api'
import { soundAlert } from '../utils/soundAlert'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('dastak_partner_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [restaurant, setRestaurant] = useState(() => {
    try {
      const saved = localStorage.getItem('dastak_partner_restaurant')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(localStorage.getItem('dastak_partner_token'))
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('dastak_partner_session_token'))
  
  // If user is already cached or no tokens exist, do not block with full-screen loader
  const [loading, setLoading] = useState(() => {
    const hasTokens = Boolean(localStorage.getItem('dastak_partner_token') || localStorage.getItem('dastak_partner_session_token'))
    const hasUser = Boolean(localStorage.getItem('dastak_partner_user'))
    return hasTokens && !hasUser
  })

  const fetchRestaurantProfile = useCallback(async () => {
    try {
      const res = await restaurantApi.getProfile()
      const rest = res.data?.data || null
      if (rest) {
        setRestaurant(rest)
        localStorage.setItem('dastak_partner_restaurant', JSON.stringify(rest))
      }
      return rest
    } catch (e) {
      console.warn('Failed to load restaurant profile context:', e)
      return null
    }
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem('dastak_partner_token')
    localStorage.removeItem('dastak_partner_session_token')
    localStorage.removeItem('dastak_partner_user')
    localStorage.removeItem('dastak_partner_restaurant')
    setToken(null)
    setSessionToken(null)
    setUser(null)
    setRestaurant(null)
  }, [])

  const checkAuth = useCallback(async () => {
    const storedSessionToken = localStorage.getItem('dastak_partner_session_token')
    const storedToken = localStorage.getItem('dastak_partner_token')

    if (!storedSessionToken && !storedToken) {
      setUser(null)
      setRestaurant(null)
      setLoading(false)
      return
    }

    if (storedSessionToken) {
      try {
        const res = await authApi.validateSession(storedSessionToken)
        const userData = res.data?.data?.user || res.data?.user || null
        if (userData) {
          setUser(userData)
          localStorage.setItem('dastak_partner_user', JSON.stringify(userData))
          fetchRestaurantProfile()
        }
      } catch (e) {
        console.warn('Partner permanent session validation failed / revoked:', e)
        clearSession()
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      const meRes = await authApi.me()
      const userData = meRes.data?.data || null
      if (userData) {
        setUser(userData)
        localStorage.setItem('dastak_partner_user', JSON.stringify(userData))
        fetchRestaurantProfile()
      }
    } catch (e) {
      console.warn('Token validation failed:', e)
      clearSession()
    } finally {
      setLoading(false)
    }
  }, [fetchRestaurantProfile, clearSession])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const startVerification = async (mobile) => {
    const res = await authApi.startVerification(mobile)
    return res.data?.data || res.data
  }

  const resendOtp = async (sessionId) => {
    const res = await authApi.resendOtp(sessionId)
    return res.data?.data || res.data
  }

  const verifyDeviceOtp = async (sessionId, otp, name = null) => {
    soundAlert.initContext()
    const res = await authApi.verifyOtp(sessionId, otp, name)
    const tokenVal = res.data?.data?.token || res.data?.token
    const rawSessionToken = res.data?.data?.session_token || res.data?.session_token
    const userData = res.data?.data?.user || res.data?.user

    if (!tokenVal) {
      throw new Error('No token returned from server')
    }

    localStorage.setItem('dastak_partner_token', tokenVal)
    setToken(tokenVal)

    if (rawSessionToken) {
      localStorage.setItem('dastak_partner_session_token', rawSessionToken)
      setSessionToken(rawSessionToken)
    }

    if (userData) {
      localStorage.setItem('dastak_partner_user', JSON.stringify(userData))
      setUser(userData)
    }

    await fetchRestaurantProfile()

    return {
      token: tokenVal,
      sessionToken: rawSessionToken,
      user: userData,
      response: res,
    }
  }

  const verifyDevicePin = async (sessionId, pin) => {
    soundAlert.initContext()
    const res = await authApi.verifyPin(sessionId, pin)
    const tokenVal = res.data?.data?.token || res.data?.token
    const rawSessionToken = res.data?.data?.session_token || res.data?.session_token
    const userData = res.data?.data?.user || res.data?.user

    if (!tokenVal) {
      throw new Error('No token returned from server')
    }

    localStorage.setItem('dastak_partner_token', tokenVal)
    setToken(tokenVal)

    if (rawSessionToken) {
      localStorage.setItem('dastak_partner_session_token', rawSessionToken)
      setSessionToken(rawSessionToken)
    }

    if (userData) {
      localStorage.setItem('dastak_partner_user', JSON.stringify(userData))
      setUser(userData)
    }

    await fetchRestaurantProfile()

    return {
      token: tokenVal,
      sessionToken: rawSessionToken,
      user: userData,
      response: res,
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      console.warn('Logout API error:', e)
    } finally {
      clearSession()
    }
  }

  const isAuthenticated = Boolean((token || sessionToken) && user)

  return (
    <AuthContext.Provider
      value={{
        user,
        restaurant,
        token,
        sessionToken,
        loading,
        isAuthenticated,
        startVerification,
        resendOtp,
        verifyDeviceOtp,
        verifyDevicePin,
        logout,
        fetchRestaurantProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
