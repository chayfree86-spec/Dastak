import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import authApi from '../api/auth.api'
import deliveryApi from '../api/delivery.api'
import soundAlert from '../utils/soundAlert'
import { getCurrentPosition } from '../utils/geo'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [riderProfile, setRiderProfile] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('dastak_delivery_token'))
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('dastak_delivery_session_token'))
  const [loading, setLoading] = useState(() => {
    return Boolean(localStorage.getItem('dastak_delivery_token') || localStorage.getItem('dastak_delivery_session_token'))
  })

  // Active delivery state cached across tabs
  const [activeOrder, setActiveOrder] = useState(null)
  const [newAssignmentModal, setNewAssignmentModal] = useState(null)

  const fetchRiderProfile = useCallback(async () => {
    try {
      const res = await deliveryApi.getProfile()
      const profileData = res.data?.data || null
      setRiderProfile(profileData)
      return profileData
    } catch (e) {
      console.warn('Failed to load rider profile:', e)
      return null
    }
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem('dastak_delivery_token')
    localStorage.removeItem('dastak_delivery_session_token')
    localStorage.removeItem('dastak_delivery_user')
    setToken(null)
    setSessionToken(null)
    setUser(null)
    setRiderProfile(null)
    setActiveOrder(null)
  }, [])

  const checkAuth = useCallback(async () => {
    const storedSessionToken = localStorage.getItem('dastak_delivery_session_token')
    const storedToken = localStorage.getItem('dastak_delivery_token')

    if (storedSessionToken) {
      try {
        const res = await authApi.validateSession(storedSessionToken)
        const userData = res.data?.data?.user || res.data?.user || null
        if (userData) {
          setUser(userData)
          await fetchRiderProfile()
        }
      } catch (e) {
        console.warn('Rider device session invalid / revoked:', e)
        clearSession()
      } finally {
        setLoading(false)
      }
      return
    }

    if (!storedToken) {
      setUser(null)
      setRiderProfile(null)
      setLoading(false)
      return
    }

    try {
      const meRes = await authApi.me()
      const userData = meRes.data?.data || null
      setUser(userData)
      await fetchRiderProfile()
    } catch (e) {
      console.warn('Token validation failed:', e)
      clearSession()
    } finally {
      setLoading(false)
    }
  }, [fetchRiderProfile, clearSession])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Periodic GPS location stream when rider is online
  useEffect(() => {
    if (!token || !riderProfile?.is_online) return

    const sendGps = async () => {
      try {
        const pos = await getCurrentPosition()
        if (pos.latitude && pos.longitude) {
          await deliveryApi.updateLocation(pos)
        }
      } catch (err) {
        // Geolocation silent catch
      }
    }

    sendGps()
    const interval = setInterval(sendGps, 30000)
    return () => clearInterval(interval)
  }, [token, riderProfile?.is_online])

  // Periodic active order polling
  const checkAssignedOrder = useCallback(async () => {
    if (!token || !user) return null
    try {
      const res = await deliveryApi.getAssignedOrder()
      const order = res.data?.data || null

      setActiveOrder((prevOrder) => {
        if (order && (!prevOrder || prevOrder.id !== order.id)) {
          setNewAssignmentModal(order)
          soundAlert.playOrderTone()
        }
        return order
      })
      return order
    } catch (err) {
      return null
    }
  }, [token, user])

  useEffect(() => {
    if (!token || !user) return
    checkAssignedOrder()
    const pollInterval = setInterval(checkAssignedOrder, 10000)
    return () => clearInterval(pollInterval)
  }, [token, user, checkAssignedOrder])

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

    localStorage.setItem('dastak_delivery_token', tokenVal)
    if (rawSessionToken) {
      localStorage.setItem('dastak_delivery_session_token', rawSessionToken)
      setSessionToken(rawSessionToken)
    }
    setToken(tokenVal)
    setUser(userData)

    const profile = await fetchRiderProfile()
    await checkAssignedOrder()
    return { user: userData, riderProfile: profile }
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

  const toggleDutyStatus = async (isOnline) => {
    const res = await deliveryApi.toggleDutyStatus(isOnline)
    const updated = res.data?.data || null
    if (updated) {
      setRiderProfile(updated)
    } else {
      setRiderProfile((prev) => (prev ? { ...prev, is_online: isOnline } : { is_online: isOnline }))
    }
    return updated
  }

  const updateProfileState = (partial) => {
    setRiderProfile((prev) => (prev ? { ...prev, ...partial } : partial))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        riderProfile,
        token,
        sessionToken,
        loading,
        isAuthenticated: !!token && !!user,
        activeOrder,
        newAssignmentModal,
        setNewAssignmentModal,
        startVerification,
        resendOtp,
        verifyDeviceOtp,
        changeDevice,
        logout,
        refreshProfile: fetchRiderProfile,
        toggleDutyStatus,
        updateProfileState,
        refreshActiveOrder: checkAssignedOrder,
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
