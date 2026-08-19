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
  const [loading, setLoading] = useState(true)

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

  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('dastak_delivery_token')
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
      localStorage.removeItem('dastak_delivery_token')
      setUser(null)
      setRiderProfile(null)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }, [fetchRiderProfile])

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
    const interval = setInterval(sendGps, 30000) // update every 30s
    return () => clearInterval(interval)
  }, [token, riderProfile?.is_online])

  // Periodic active order polling
  const checkAssignedOrder = useCallback(async () => {
    if (!token || !user) return null
    try {
      const res = await deliveryApi.getAssignedOrder()
      const order = res.data?.data || null

      setActiveOrder((prevOrder) => {
        // Trigger new assignment popup if newly assigned order detected
        if (order && (!prevOrder || prevOrder.id !== order.id)) {
          setNewAssignmentModal(order)
          soundAlert.playOrderTone()
        }
        return order
      })
      return order
    } catch (err) {
      console.warn('Active order poll failed:', err)
      return null
    }
  }, [token, user])

  useEffect(() => {
    if (!token || !user) return
    checkAssignedOrder()
    const pollInterval = setInterval(checkAssignedOrder, 10000) // check every 10s
    return () => clearInterval(pollInterval)
  }, [token, user, checkAssignedOrder])

  const login = async (identifier, password) => {
    soundAlert.initContext()

    const res = await authApi.login({
      identifier,
      password,
    })

    const tokenVal = res.data?.data?.token
    const userData = res.data?.data?.user

    const role = userData?.role || (userData?.roles && userData?.roles[0]?.slug)
    if (role && role !== 'delivery_boy' && role !== 'super_admin') {
      throw new Error('This account is not registered as a Delivery Partner. Please use the Customer or Partner app.')
    }

    localStorage.setItem('dastak_delivery_token', tokenVal)
    setToken(tokenVal)
    setUser(userData)

    const profile = await fetchRiderProfile()
    await checkAssignedOrder()
    return { user: userData, riderProfile: profile }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      console.warn('Logout API warning:', e)
    } finally {
      localStorage.removeItem('dastak_delivery_token')
      setToken(null)
      setUser(null)
      setRiderProfile(null)
      setActiveOrder(null)
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
        loading,
        isAuthenticated: !!token && !!user,
        activeOrder,
        newAssignmentModal,
        setNewAssignmentModal,
        login,
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
