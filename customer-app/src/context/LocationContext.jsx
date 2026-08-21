import React, { createContext, useContext, useState, useEffect } from 'react'
import customerApi from '../api/customer.api'
import { useAuth } from './AuthContext'
import { detectCurrentGPS } from '../utils/geo'

const LocationContext = createContext(null)

export const LocationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth()
  const [addresses, setAddresses] = useState(() => {
    const savedList = localStorage.getItem('dastak_saved_addresses_list')
    return savedList ? JSON.parse(savedList) : []
  })

  const [activeAddress, setActiveAddress] = useState(() => {
    // No hardcoded/dummy default — real address comes from the backend (or GPS/selection).
    const saved = localStorage.getItem('dastak_active_address')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)
  const [isGpsModalOpen, setIsGpsModalOpen] = useState(false)

  // Fetch addresses if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses()
    }
  }, [isAuthenticated])

  // Auto-detect real location on initial mount only when no usable address is
  // stored (no hardcoded dummy-address matching — a real saved address stays).
  useEffect(() => {
    const saved = localStorage.getItem('dastak_active_address')
    let parsed = null
    try {
      parsed = saved ? JSON.parse(saved) : null
    } catch (e) {}

    const hasUsableAddress = Boolean(parsed?.address && parsed?.latitude && parsed?.longitude)

    if (!hasUsableAddress) {
      detectCurrentLocation().catch((err) => {
        console.warn('Auto location detection:', err)
      })
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('dastak_saved_addresses_list', JSON.stringify(addresses))
  }, [addresses])

  const loadAddresses = async () => {
    setLoading(true)
    try {
      const res = await customerApi.getAddresses()
      const rawList = res.data?.data || res.data || []
      const list = rawList.map((a) => {
        const fullAddr =
          a.address ||
          [a.address_line1, a.address_line2, a.city, a.pincode]
            .filter(Boolean)
            .join(', ') ||
          ''
        return {
          ...a,
          customer_name: a.contact_name || a.customer_name || a.name || 'Valued Customer',
          customer_phone: a.contact_mobile || a.customer_phone || a.phone || '',
          address: fullAddr,
          landmark: a.landmark || '',
          type: (a.type?.value || a.type || 'Home').toString(),
        }
      })
      setAddresses(list)

      // Only auto-select the default saved address if the user doesn't already
      // have a usable active address (e.g. a live GPS-detected one).
      const savedActive = localStorage.getItem('dastak_active_address')
      let currentActive = null
      try {
        currentActive = savedActive ? JSON.parse(savedActive) : null
      } catch (e) {}
      const hasUsableActive = Boolean(
        currentActive?.address && currentActive?.latitude && currentActive?.longitude
      )

      const def = list.find((a) => a.is_default) || list[0]
      if (def && !hasUsableActive) {
        selectAddress(def)
      } else if (!hasUsableActive) {
        detectCurrentLocation().catch(() => {})
      }
    } catch (e) {
      console.warn('Failed to load saved addresses from backend:', e)
    } finally {
      setLoading(false)
    }
  }

  const selectAddress = (addr) => {
    setActiveAddress(addr)
    localStorage.setItem('dastak_active_address', JSON.stringify(addr))
  }

  // Set Address as Default
  const makeDefaultAddress = async (addressId) => {
    try {
      if (isAuthenticated && typeof addressId === 'number') {
        await customerApi.setDefaultAddress(addressId)
      }
    } catch (e) {
      console.warn('Backend setDefault error, updating local:', e)
    }

    setAddresses((prev) =>
      prev.map((addr) => {
        const isTarget = addr.id === addressId
        const updated = { ...addr, is_default: isTarget }
        if (isTarget) {
          selectAddress(updated)
        }
        return updated
      })
    )

    if (activeAddress && activeAddress.id === addressId) {
      const updatedActive = { ...activeAddress, is_default: true }
      selectAddress(updatedActive)
    }
  }

  // Update Address
  const updateAddressItem = async (addressId, updatedFields) => {
    try {
      if (isAuthenticated && typeof addressId === 'number') {
        await customerApi.updateAddress(addressId, {
          name: updatedFields.customer_name,
          phone: updatedFields.customer_phone,
          address_line1: updatedFields.address,
          landmark: updatedFields.landmark,
          type: updatedFields.type,
          is_default: updatedFields.is_default,
          latitude: updatedFields.latitude,
          longitude: updatedFields.longitude,
          city: updatedFields.city,
        })
      }
    } catch (e) {
      console.warn('Backend updateAddress error, updating local:', e)
    }

    setAddresses((prev) =>
      prev.map((addr) => {
        if (addr.id === addressId) {
          const merged = { ...addr, ...updatedFields }
          if (activeAddress && activeAddress.id === addressId) {
            selectAddress(merged)
          }
          return merged
        }
        return addr
      })
    )

    if (activeAddress && activeAddress.id === addressId) {
      selectAddress({ ...activeAddress, ...updatedFields })
    }
  }

  // Delete Address
  const removeAddress = async (addressId) => {
    try {
      if (isAuthenticated && typeof addressId === 'number') {
        await customerApi.destroyAddress(addressId)
      }
    } catch (e) {
      console.warn('Backend deleteAddress error, updating local:', e)
    }

    setAddresses((prev) => {
      const remaining = prev.filter((a) => a.id !== addressId)
      // If deleted active address, set first remaining as active
      if (activeAddress && activeAddress.id === addressId) {
        if (remaining.length > 0) {
          selectAddress(remaining[0])
        } else {
          // No addresses left — clear active (no dummy fallback); user re-selects/detects.
          setActiveAddress(null)
          localStorage.removeItem('dastak_active_address')
        }
      }
      return remaining
    })
  }

  // Save new Address to address book
  const saveAddressToBook = async (addrData) => {
    const formatted = {
      id: addrData.id || Date.now(),
      customer_name: addrData.customer_name || user?.name || 'Customer',
      customer_phone: addrData.customer_phone || user?.mobile || '',
      address: addrData.address,
      full_address: addrData.full_address || addrData.address,
      landmark: addrData.landmark || '',
      type: addrData.type || 'Home',
      is_default: Boolean(addrData.is_default),
      latitude: addrData.latitude ?? null,
      longitude: addrData.longitude ?? null,
      city: addrData.city || '',
    }

    try {
      if (isAuthenticated) {
        const res = await customerApi.storeAddress({
          name: formatted.customer_name,
          phone: formatted.customer_phone,
          address_line1: formatted.address,
          landmark: formatted.landmark,
          type: formatted.type,
          is_default: formatted.is_default,
          latitude: formatted.latitude,
          longitude: formatted.longitude,
          city: formatted.city,
        })
        if (res.data?.id) {
          formatted.id = res.data.id
        }
      }
    } catch (e) {
      console.warn('Backend storeAddress error, saving locally:', e)
    }

    setAddresses((prev) => {
      let updated = formatted.is_default
        ? prev.map((a) => ({ ...a, is_default: false }))
        : [...prev]
      return [formatted, ...updated]
    })

    selectAddress(formatted)
    return formatted
  }

  const openGpsModal = () => setIsGpsModalOpen(true)
  const closeGpsModal = () => setIsGpsModalOpen(false)

  // Detect GPS Location with Automatic Reverse Geocoding and GPS-Off Modal Trigger
  const detectCurrentLocation = async () => {
    try {
      const geocoded = await detectCurrentGPS()
      const detected = {
        id: 'gps_' + Date.now(),
        customer_name: activeAddress?.customer_name || user?.name || 'My Location',
        customer_phone: activeAddress?.customer_phone || user?.mobile || '',
        address: geocoded.short_address || geocoded.formatted_address,
        full_address: geocoded.formatted_address,
        landmark: geocoded.locality || 'Detected via GPS',
        type: 'Current Location',
        is_default: true,
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        city: geocoded.city,
      }
      selectAddress(detected)
      setIsGpsModalOpen(false)
      return detected
    } catch (err) {
      setIsGpsModalOpen(true)
      throw err
    }
  }

  return (
    <LocationContext.Provider
      value={{
        addresses,
        activeAddress,
        loading,
        selectAddress,
        loadAddresses,
        makeDefaultAddress,
        updateAddressItem,
        removeAddress,
        saveAddressToBook,
        detectCurrentLocation,
        isGpsModalOpen,
        openGpsModal,
        closeGpsModal,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export const useLocationContext = () => {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocationContext must be used within LocationProvider')
  }
  return context
}

export default LocationContext
