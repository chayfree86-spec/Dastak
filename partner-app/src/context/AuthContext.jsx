import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import authApi from '../api/auth.api'
import restaurantApi from '../api/restaurant.api'
import { soundAlert } from '../utils/soundAlert'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('dastak_partner_token'))
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('dastak_partner_session_token'))
  const [loading, setLoading] = useState(true)

  const fetchRestaurantProfile = useCallback(async () => {
    try {
      const res = await restaurantApi.getProfile()
      const rest = res.data?.data || null
      setRestaurant(rest)
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
    setToken(null)
    setSessionToken(null)
    setUser(null)
    setRestaurant(null)
  }, [])

  const checkAuth = useCallback(async () => {
    const storedSessionToken = localStorage.getItem('dastak_partner_session_token')
    const storedToken = localStorage.getItem('dastak_partner_token')

    if (storedSessionToken) {
      try {
        const res = await authApi.validateSession(storedSessionToken)
        const userData = res.data?.data?.user || res.data?.user || null
        if (userData) {
          setUser(userData)
          await fetchRestaurantProfile()
        }
      } catch (e) {
        console.warn('Partner permanent session validation failed / revoked:', e)
        clearSession()
      } finally {
        setLoading(false)
      }
      return
    }

    if (!storedToken) {
      setUser(null)
      setRestaurant(null)
      setLoading(false)
      return
    }

    try {
      const meRes = await authApi.me()
      const userData = meRes.data?.data || null
      setUser(userData)
      await fetchRestaurantProfile()
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

    localStorage.setItem('dastak_partner_token', tokenVal)
    if (rawSessionToken) {
      localStorage.setItem('dastak_partner_session_token', rawSessionToken)
      setSessionToken(rawSessionToken)
    }
    setToken(tokenVal)
    setUser(userData)

    const rest = await fetchRestaurantProfile()
    return { user: userData, restaurant: rest }
  }

  const changeDevice = async () => {
    try {
      await authApi.changeDevice()
    } catch (e) {
      console.warn('Change device API warning:', e)
    } finally {
      clearSession()
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      console.warn('Logout API warning:', e)
    } finally {
      clearSession()
    }
  }

  const updateRestaurant = (partial) => {
    setRestaurant((prev) => {
      if (typeof partial === 'function') return partial(prev)
      return prev ? { ...prev, ...partial } : partial
    })
  }

  const updateStoreState = updateRestaurant

  return (
    <AuthContext.Provider
      value={{
        user,
        restaurant,
        token,
        sessionToken,
        loading,
        isAuthenticated: !!token && !!user,
        startVerification,
        resendOtp,
        verifyDeviceOtp,
        changeDevice,
        logout,
        refreshProfile: fetchRestaurantProfile,
        updateStoreState,
        updateRestaurant,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export default AuthProvider
