export const openGoogleMapsNavigation = (latitude, longitude, label = '') => {
  if (!latitude || !longitude) {
    if (label) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(label)}&dir_action=navigate`,
        '_blank'
      )
    }
    return
  }

  // Google Maps Direct Navigation Mode Scheme (&dir_action=navigate triggers instant Turn-by-Turn GPS)
  const isAndroid = /Android/i.test(navigator.userAgent)
  const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent)

  let url
  if (isAndroid) {
    // Android Native Google Maps Navigation Intent (Opens directly in Navigation mode)
    url = `google.navigation:q=${latitude},${longitude}&mode=d`
  } else if (isIos) {
    // iOS Google Maps app navigation fallback to Apple Maps / Web
    url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving&dir_action=navigate`
  } else {
    // Web / PWA / Desktop: Launch direct Turn-by-Turn navigation action
    url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving&dir_action=navigate`
  }

  window.open(url, '_blank')
}

export const makePhoneCall = (phoneNumber) => {
  if (!phoneNumber) return
  window.location.href = `tel:${phoneNumber.replace(/[^0-9+]/g, '')}`
}

export const openWhatsAppMessage = (phoneNumber, text = '') => {
  if (!phoneNumber) return
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
  const formatted = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
  window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(text)}`, '_blank')
}

export const copyToClipboard = async (text) => {
  if (!text) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    return false
  }
}

// Calculate distance between two GPS coordinates using Haversine formula
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null
  const R = 6371 // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c
  return Math.round(d * 10) / 10 // round to 1 decimal
}

// Calculate estimated travel time in minutes based on urban motorcycle speed (~22 km/h)
export const calculateEtaMinutes = (distanceKm) => {
  if (!distanceKm || distanceKm <= 0) return 3
  const speedKmh = 22
  const timeHours = distanceKm / speedKmh
  return Math.max(3, Math.round(timeHours * 60))
}

export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
      },
      (err) => reject(err),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    )
  })
}

/**
 * Fetch real road driving route using OSRM (Open Source Routing Machine)
 * Returns road polyline coordinates [[lat, lng], ...], road distance (km), and driving duration (mins)
 */
export const fetchOsrmRoute = async (startLat, startLng, endLat, endLng) => {
  if (!startLat || !startLng || !endLat || !endLng) return null

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`
    const res = await fetch(url)
    const data = await res.json()

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const primaryRoute = data.routes[0]
      const coordinates = primaryRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng])
      const distanceKm = Number((primaryRoute.distance / 1000).toFixed(2))
      const durationMinutes = Math.max(2, Math.round(primaryRoute.duration / 60))

      const steps = primaryRoute.legs?.[0]?.steps?.map((s) => ({
        instruction: s.maneuver?.type + ' ' + (s.maneuver?.modifier || ''),
        name: s.name || 'Road',
        distance: s.distance,
        duration: s.duration,
      })) || []

      return {
        coordinates,
        distanceKm,
        durationMinutes,
        steps,
        source: 'OSRM',
      }
    }
  } catch (error) {
    console.warn('OSRM route fetch failed, fallback to direct:', error)
  }

  const distanceKm = calculateDistanceKm(startLat, startLng, endLat, endLng) || 2.0
  const durationMinutes = calculateEtaMinutes(distanceKm)
  return {
    coordinates: [
      [startLat, startLng],
      [endLat, endLng],
    ],
    distanceKm,
    durationMinutes,
    steps: [],
    source: 'FALLBACK',
  }
}
