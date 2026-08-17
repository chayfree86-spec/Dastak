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
