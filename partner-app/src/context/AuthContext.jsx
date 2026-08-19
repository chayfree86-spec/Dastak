import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import authApi from '../api/auth.api'
import restaurantApi from '../api/restaurant.api'
import { soundAlert } from '../utils/soundAlert'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('dastak_partner_token'))
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

  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('dastak_partner_token')
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
      localStorage.removeItem('dastak_partner_token')
      setUser(null)
      setRestaurant(null)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }, [fetchRestaurantProfile])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (identifier, password) => {
    // Unlock audio context on user interaction
    soundAlert.initContext()

    const res = await authApi.login({
      identifier,
      password,
      device_name: 'Dastak Partner Web/PWA',
    })

    const tokenVal = res.data?.data?.token
    const userData = res.data?.data?.user

    const role = userData?.role || (userData?.roles && userData?.roles[0]?.slug)
    if (role && role !== 'restaurant_owner' && role !== 'super_admin') {
      throw new Error('This account is not registered as a Restaurant Partner. Please use the Customer or Delivery app.')
    }

    localStorage.setItem('dastak_partner_token', tokenVal)
    setToken(tokenVal)
    setUser(userData)

    const rest = await fetchRestaurantProfile()
    return { user: userData, restaurant: rest }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      console.warn('Logout API warning:', e)
    } finally {
      localStorage.removeItem('dastak_partner_token')
      setToken(null)
      setUser(null)
      setRestaurant(null)
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
        loading,
        isAuthenticated: !!token && !!user,
        login,
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
