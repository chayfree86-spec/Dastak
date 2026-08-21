/**
 * Open phone dialer
 */
export const makePhoneCall = (phoneNumber) => {
  if (!phoneNumber) return
  const cleaned = phoneNumber.replace(/[^0-9+]/g, '')
  window.location.href = `tel:${cleaned}`
}

/**
 * Open WhatsApp
 */
export const openWhatsApp = (phoneNumber, text = '') => {
  if (!phoneNumber) return
  let cleaned = phoneNumber.replace(/[^0-9]/g, '')
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned
  }
  const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`
  window.open(url, '_blank')
}

/**
 * Reverse Geocode coordinates to real formatted street address
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'DastakFoodDeliveryApp/1.0',
        },
      }
    )
    const data = await res.json()
    if (data && data.display_name) {
      const addr = data.address || {}
      const locality =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.road ||
        addr.village ||
        addr.town ||
        addr.city_district ||
        'Location'
      const city = addr.city || addr.state_district || addr.state || 'Kanpur'
      const pincode = addr.postcode || ''

      return {
        formatted_address: data.display_name,
        short_address: `${locality}, ${city}${pincode ? ' ' + pincode : ''}`,
        locality,
        city,
        pincode,
        latitude: Number(lat),
        longitude: Number(lng),
      }
    }
  } catch (e) {
    console.warn('Reverse geocode error:', e)
  }

  return {
    formatted_address: `Location (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`,
    short_address: `Coordinates: ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`,
    latitude: Number(lat),
    longitude: Number(lng),
  }
}

/**
 * Search Places Auto-complete API (Instant search for areas, roads, colonies)
 */
export const searchPlacesAuto = async (query) => {
  if (!query || query.trim().length < 2) return []

  try {
    // 1. Try Nominatim with country code IN (India)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&countrycodes=in&limit=6&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'DastakFoodDeliveryApp/1.0',
        },
      }
    )
    const items = await res.json()
    if (Array.isArray(items) && items.length > 0) {
      return items.map((it) => {
        const addr = it.address || {}
        const mainText =
          it.name ||
          addr.road ||
          addr.suburb ||
          addr.neighbourhood ||
          addr.village ||
          it.display_name.split(',')[0]
        const subText = it.display_name

        return {
          id: it.place_id || String(it.osm_id || Math.random()),
          main_text: mainText,
          sub_text: subText,
          formatted_address: it.display_name,
          latitude: parseFloat(it.lat),
          longitude: parseFloat(it.lon),
          city: addr.city || addr.state_district || 'Kanpur',
        }
      })
    }
  } catch (e) {
    console.warn('Place search error, attempting fallback:', e)
  }

  // Fallback to Photon
  try {
    const res2 = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`
    )
    const data2 = await res2.json()
    if (data2.features && data2.features.length > 0) {
      return data2.features.map((f) => {
        const p = f.properties || {}
        const name = p.name || query
        const city = p.city || p.district || p.state || 'Kanpur'
        const full = [p.name, p.street, p.city, p.state, p.postcode]
          .filter(Boolean)
          .join(', ')

        return {
          id: f.geometry?.coordinates?.join('_') || String(Math.random()),
          main_text: name,
          sub_text: full || name,
          formatted_address: full || name,
          latitude: f.geometry?.coordinates?.[1] || 26.456,
          longitude: f.geometry?.coordinates?.[0] || 80.339,
          city,
        }
      })
    }
  } catch (e) {}

  return []
}

/**
 * IP-based approximate location fallback
 */
export const fallbackIpLocation = async () => {
  try {
    const res = await fetch('https://ipapi.co/json/')
    const data = await res.json()
    if (data && data.latitude && data.longitude) {
      const city = data.city || data.region || 'Kanpur'
      return {
        formatted_address: `${data.city || 'Current Area'}, ${data.region || ''} ${data.postal || ''}`.trim(),
        short_address: `${data.city || 'My Location'}, ${data.region || 'India'}`,
        locality: data.city || 'Current Location',
        city: city,
        pincode: data.postal || '',
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
      }
    }
  } catch (e) {
    console.warn('IP location fetch fallback error:', e)
  }

  // Sensible local default if completely offline
  return {
    formatted_address: 'Kalyanpur, Kanpur, Uttar Pradesh 208017',
    short_address: 'Kalyanpur, Kanpur',
    locality: 'Kalyanpur',
    city: 'Kanpur',
    pincode: '208017',
    latitude: 26.4947,
    longitude: 80.2798,
  }
}

/**
 * High Accuracy Browser Geolocation with Timeout and Smart Fallback
 */
export const detectCurrentGPS = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      fallbackIpLocation().then(resolve).catch(reject)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          const geocoded = await reverseGeocode(lat, lng)
          resolve(geocoded)
        } catch (e) {
          const ipLoc = await fallbackIpLocation()
          resolve(ipLoc)
        }
      },
      async (error) => {
        try {
          const ipLoc = await fallbackIpLocation()
          resolve(ipLoc)
        } catch (err) {
          reject(error)
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    )
  })
}

/**
 * Calculate distance in KM using Haversine formula
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 1.5
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Number((R * c).toFixed(2))
}

/**
 * Calculate ETA in minutes based on distance
 */
export const calculateEtaMinutes = (distanceKm) => {
  if (!distanceKm) return 15
  const minutes = Math.ceil((distanceKm / 22) * 60) + 3
  return Math.max(3, minutes)
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
      // Convert OSRM [lng, lat] GeoJSON coordinates to Leaflet [lat, lng]
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
    console.warn('OSRM route fetch failed, using fallback interpolation:', error)
  }

  // Fallback if OSRM server is unreachable or offline: generate smooth straight-line coordinates
  const distanceKm = calculateDistanceKm(startLat, startLng, endLat, endLng)
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

