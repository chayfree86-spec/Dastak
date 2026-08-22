import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import deliveryApi from '../api/delivery.api'
import { getCurrentPosition, calculateDistanceKm } from '../utils/geo'
import { useToast } from './ToastContext'
import { useAuth } from './AuthContext'

const LocationContext = createContext(null)

export const DEFAULT_ZONES = [
  {
    id: 'kanpur-central',
    name: 'Kanpur Central Zone',
    area: 'Ghanta Ghar & Railway Hub',
    latitude: 26.4499,
    longitude: 80.3319,
    radiusKm: 6.5,
    tag: 'High Order Volume',
  },
  {
    id: 'swaroop-nagar',
    name: 'Swaroop Nagar Hub',
    area: 'Mall Road, Motijheel & Medical College',
    latitude: 26.4800,
    longitude: 80.3200,
    radiusKm: 5.0,
    tag: 'Popular Cafes',
  },
  {
    id: 'civil-lines',
    name: 'Civil Lines & VIP Road',
    area: 'Collectorate, Green Park & Ganga Barrage',
    latitude: 26.4720,
    longitude: 80.3450,
    radiusKm: 5.5,
    tag: 'Premium Dining',
  },
  {
    id: 'kakadeo',
    name: 'Kakadeo Coaching Hub',
    area: 'Navin Nagar, Deoki Nagar & Sharda Nagar',
    latitude: 26.4830,
    longitude: 80.2950,
    radiusKm: 4.5,
    tag: 'Fast Food Hub',
  },
  {
    id: 'kalyanpur',
    name: 'Kalyanpur & IIT Zone',
    area: 'IIT Gate, GT Road & Awas Vikas',
    latitude: 26.5050,
    longitude: 80.2350,
    radiusKm: 6.0,
    tag: 'Campus Orders',
  },
  {
    id: 'gumti-5',
    name: 'Gumti No. 5 Market',
    area: 'Lajpat Nagar, 80 Feet Road & R.K. Nagar',
    latitude: 26.4680,
    longitude: 80.3120,
    radiusKm: 4.0,
    tag: 'Market & Snacks',
  },
  {
    id: 'govind-nagar',
    name: 'Govind Nagar & Gujaini',
    area: 'C Block Market, Dabouli & Ratan Lal Nagar',
    latitude: 26.4380,
    longitude: 80.2980,
    radiusKm: 5.5,
    tag: 'Dense Residential',
  },
  {
    id: 'barra',
    name: 'Barra & Naubasta Zone',
    area: 'Barra 2, Barra 8 & Hanspuram Bypass',
    latitude: 26.4200,
    longitude: 80.3150,
    radiusKm: 6.0,
    tag: 'Rapid Expansion',
  },
  {
    id: 'kidwai-nagar',
    name: 'Kidwai Nagar & Yashoda Nagar',
    area: 'K Block, Juhi & Transport Nagar',
    latitude: 26.4300,
    longitude: 80.3420,
    radiusKm: 5.0,
    tag: 'High Density',
  },
  {
    id: 'chakeri',
    name: 'Chakeri & Shyam Nagar',
    area: 'Air Force Station, Ramadevi & Harjinder Nagar',
    latitude: 26.4150,
    longitude: 80.3800,
    radiusKm: 6.5,
    tag: 'Highway Corridor',
  },
]

export const LocationProvider = ({ children }) => {
  const toast = useToast()
  const { riderProfile, activeOrder } = useAuth()

  const isOnline = Boolean(riderProfile?.is_online)
  const activeOrderId = activeOrder?.id || null

  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('dastak_rider_location')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.warn('Failed to parse saved rider location:', e)
    }
    return {
      latitude: 26.4499,
      longitude: 80.3319,
      zoneName: 'Kanpur Central Zone',
      address: 'Kanpur Central, Uttar Pradesh',
      isGpsLive: false,
      accuracy: null,
      speed: null,
      heading: null,
      updatedAt: new Date().toISOString(),
    }
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isTrackingActive, setIsTrackingActive] = useState(false)
  const [lastStreamedAt, setLastStreamedAt] = useState(null)

  const lastPosRef = useRef({
    latitude: location.latitude,
    longitude: location.longitude,
    timestamp: 0,
  })

  const saveLocationState = useCallback((newLoc) => {
    setLocation(newLoc)
    try {
      localStorage.setItem('dastak_rider_location', JSON.stringify(newLoc))
    } catch (e) {
      console.warn('Failed to persist rider location:', e)
    }
  }, [])

  // Stream live telemetry to backend API
  const streamTelemetry = useCallback(async (lat, lng, heading = null, speed = null, orderId = null) => {
    try {
      await deliveryApi.streamLocation({
        latitude: lat,
        longitude: lng,
        heading: heading !== null ? Number(heading) : undefined,
        speed: speed !== null ? Number(speed) : undefined,
        active_order_id: orderId || undefined,
      })
      setLastStreamedAt(new Date().toISOString())
    } catch (err) {
      // Fallback simple location update
      try {
        await deliveryApi.updateLocation({ latitude: lat, longitude: lng })
        setLastStreamedAt(new Date().toISOString())
      } catch (fallbackErr) {
        console.warn('Telemetry update fallback failed:', fallbackErr)
      }
    }
  }, [])

  // 1. One-tap detect GPS + Reverse Geocoding
  const detectGpsLocation = useCallback(async (showToast = true) => {
    setIsDetecting(true)
    try {
      const pos = await getCurrentPosition()
      const lat = pos.latitude
      const lng = pos.longitude
      const acc = pos.accuracy

      let resolvedAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      let resolvedZone = 'Current GPS Location'

      // Call backend reverse geocode
      try {
        const res = await deliveryApi.reverseGeocode(lat, lng)
        const data = res.data?.data || res.data
        if (data) {
          resolvedAddress = data.formatted_address || data.display_name || resolvedAddress
          resolvedZone = data.city ? `${data.city} Live Area` : (data.formatted_address?.split(',')[0] || 'Current Location')
        }
      } catch (geoErr) {
        console.warn('Reverse geocode fallback:', geoErr)
      }

      const updated = {
        latitude: lat,
        longitude: lng,
        zoneName: resolvedZone,
        address: resolvedAddress,
        isGpsLive: true,
        accuracy: acc,
        speed: null,
        heading: null,
        updatedAt: new Date().toISOString(),
      }

      lastPosRef.current = {
        latitude: lat,
        longitude: lng,
        timestamp: Date.now(),
      }

      saveLocationState(updated)
      await streamTelemetry(lat, lng, null, null, activeOrderId)

      if (showToast && toast) {
        toast.success(
          'Live GPS Location Set',
          `Your real-time GPS coordinates (${resolvedZone}) are now active for incoming deliveries.`
        )
      }

      return updated
    } catch (err) {
      console.error('GPS Detection failed:', err)
      if (showToast && toast) {
        toast.error(
          'GPS Permission Required',
          err.message || 'Please enable device location/GPS in browser settings.'
        )
      }
      throw err
    } finally {
      setIsDetecting(false)
    }
  }, [saveLocationState, streamTelemetry, activeOrderId, toast])

  // 2. Select Operating Zone manually
  const setOperatingZone = useCallback(async (zone) => {
    const updated = {
      latitude: zone.latitude,
      longitude: zone.longitude,
      zoneName: zone.name,
      address: zone.area ? `${zone.name} (${zone.area})` : zone.name,
      isGpsLive: false,
      accuracy: null,
      speed: null,
      heading: null,
      updatedAt: new Date().toISOString(),
    }

    lastPosRef.current = {
      latitude: zone.latitude,
      longitude: zone.longitude,
      timestamp: Date.now(),
    }

    saveLocationState(updated)
    await streamTelemetry(zone.latitude, zone.longitude, null, null, activeOrderId)

    if (toast) {
      toast.success(
        'Delivery Zone Updated',
        `Operating zone changed to ${zone.name}. You will receive orders near this zone.`
      )
    }

    setIsModalOpen(false)
    return updated
  }, [saveLocationState, streamTelemetry, activeOrderId, toast])

  // 3. Set Custom Geocoded Location
  const setCustomLocation = useCallback(async (item) => {
    const lat = Number(item.latitude || item.lat)
    const lng = Number(item.longitude || item.lon || item.lng)
    const name = item.formatted_address || item.display_name || 'Custom Location'

    const updated = {
      latitude: lat,
      longitude: lng,
      zoneName: name.split(',')[0] || 'Selected Area',
      address: name,
      isGpsLive: false,
      accuracy: null,
      speed: null,
      heading: null,
      updatedAt: new Date().toISOString(),
    }

    lastPosRef.current = {
      latitude: lat,
      longitude: lng,
      timestamp: Date.now(),
    }

    saveLocationState(updated)
    await streamTelemetry(lat, lng, null, null, activeOrderId)

    if (toast) {
      toast.success('Location Updated', `Set to ${updated.zoneName}`)
    }

    setIsModalOpen(false)
    return updated
  }, [saveLocationState, streamTelemetry, activeOrderId, toast])

  // 4. AUTOMATIC BACKGROUND GPS WATCHER & TELEMETRY STREAMER
  // Automatically watches rider's live hardware GPS and streams every 10-15s or on movement > 8m when rider is ONLINE
  useEffect(() => {
    if (!isOnline || !navigator.geolocation) {
      setIsTrackingActive(false)
      return
    }

    let watchId = null
    setIsTrackingActive(true)

    const onPositionUpdate = (pos) => {
      const { latitude, longitude, heading, speed, accuracy } = pos.coords
      const now = Date.now()
      const last = lastPosRef.current

      // Calculate distance moved in km since last sync
      const distMovedKm = calculateDistanceKm(last.latitude, last.longitude, latitude, longitude) || 0
      const timeElapsedSec = (now - last.timestamp) / 1000

      // Sync if moved > 8 meters (0.008 km) OR if more than 12 seconds have elapsed since last stream
      if (distMovedKm >= 0.008 || timeElapsedSec >= 12 || last.timestamp === 0) {
        lastPosRef.current = {
          latitude,
          longitude,
          timestamp: now,
        }

        setLocation((prev) => {
          const next = {
            ...prev,
            latitude,
            longitude,
            speed: speed !== null && !isNaN(speed) ? Number((speed * 3.6).toFixed(1)) : null, // convert m/s to km/h
            heading: heading !== null && !isNaN(heading) ? Number(heading.toFixed(1)) : null,
            accuracy: accuracy || null,
            isGpsLive: true,
            updatedAt: new Date().toISOString(),
          }
          try {
            localStorage.setItem('dastak_rider_location', JSON.stringify(next))
          } catch (e) {}
          return next
        })

        // Stream to backend
        streamTelemetry(latitude, longitude, heading, speed, activeOrderId)
      }
    }

    const onError = (err) => {
      console.warn('Continuous GPS watch warning:', err.message)
    }

    try {
      watchId = navigator.geolocation.watchPosition(onPositionUpdate, onError, {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 25000,
      })
    } catch (e) {
      console.warn('Failed to start watchPosition:', e)
    }

    // Heartbeat Interval Fallback (every 20s)
    const heartbeatInterval = setInterval(() => {
      if (document.hidden) return
      navigator.geolocation.getCurrentPosition(
        (pos) => onPositionUpdate(pos),
        () => {},
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
      )
    }, 20000)

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
      clearInterval(heartbeatInterval)
      setIsTrackingActive(false)
    }
  }, [isOnline, activeOrderId, streamTelemetry])

  const openLocationModal = () => setIsModalOpen(true)
  const closeLocationModal = () => setIsModalOpen(false)

  return (
    <LocationContext.Provider
      value={{
        location,
        isModalOpen,
        isDetecting,
        isTrackingActive,
        lastStreamedAt,
        availableZones: DEFAULT_ZONES,
        detectGpsLocation,
        setOperatingZone,
        setCustomLocation,
        openLocationModal,
        closeLocationModal,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export const useRiderLocation = () => {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useRiderLocation must be used within a LocationProvider')
  }
  return context
}

export default LocationContext
