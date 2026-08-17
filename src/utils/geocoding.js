/**
 * Robust Geocoding and Reverse Geocoding utilities
 * Connects to backend Laravel proxy and provides client-side fallbacks.
 */
import apiClient from '../api/client'

export const reverseGeocodeCoordinates = async (lat, lng) => {
  if (!lat || !lng) return null
  const numLat = Number(lat)
  const numLng = Number(lng)
  if (isNaN(numLat) || isNaN(numLng)) return null

  // 1. Try Backend Geocoding Service (cURL with proper User-Agent & provider fallbacks)
  try {
    const res = await apiClient.get(`/geocode/reverse?lat=${numLat}&lng=${numLng}`)
    const data = res?.data || res
    if (data && data.formatted_address) {
      return {
        formattedAddress: data.formatted_address,
        city: data.city || 'Kanpur',
        state: data.state || '',
        postcode: data.postcode || '',
        fullDisplayName: data.display_name || data.formatted_address,
      }
    }
  } catch (backendErr) {
    console.warn('Backend reverse geocode failed, attempting direct provider...', backendErr)
  }

  // 2. Direct BigDataCloud Client fallback
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${numLat}&longitude=${numLng}&localityLanguage=en`
    )
    if (bdcRes.ok) {
      const bdc = await bdcRes.json()
      const city = bdc.city || bdc.locality || bdc.principalSubdivision || 'Kanpur'
      const locality = bdc.locality || ''
      const state = bdc.principalSubdivision || ''
      const parts = Array.from(new Set([locality, city, state].filter(Boolean)))
      const formatted = parts.length > 0 ? parts.join(', ') : `Near ${city}`
      return {
        formattedAddress: formatted,
        city: city,
        state: state,
        postcode: bdc.postcode || '',
        fullDisplayName: formatted,
      }
    }
  } catch (bdcErr) {
    console.warn('BigDataCloud reverse geocode failed...', bdcErr)
  }

  // 3. Direct Nominatim fallback
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${numLat}&lon=${numLng}&zoom=18&addressdetails=1`
    )
    if (res.ok) {
      const data = await res.json()
      if (data) {
        const addr = data.address || {}
        const street = addr.road || addr.suburb || addr.neighbourhood || addr.residential || ''
        const area = addr.suburb || addr.village || addr.town || addr.city_district || addr.county || ''
        const city = addr.city || addr.town || addr.village || addr.city_district || addr.county || 'Kanpur'
        const parts = Array.from(new Set([street, area, city].filter(Boolean)))
        const clean = parts.length > 0 ? parts.join(', ') : (data.display_name?.split(',').slice(0, 3).join(', ') || '')
        return {
          formattedAddress: clean || data.display_name || `Location (${numLat.toFixed(4)}, ${numLng.toFixed(4)})`,
          city: city || 'Kanpur',
          state: addr.state || '',
          postcode: addr.postcode || '',
          fullDisplayName: data.display_name || '',
        }
      }
    }
  } catch (err) {
    console.error('All reverse geocoders failed:', err)
  }

  // All providers failed — do NOT invent a coordinate-string address.
  // Returning null keeps callers from persisting fake/stale address text.
  return null
}

export const forwardGeocodeAddress = async (query) => {
  if (!query || !query.trim()) return null
  const cleanQ = query.trim()

  // 1. Google Maps Geocoder (if loaded)
  if (window.google?.maps?.Geocoder) {
    try {
      const geocoder = new window.google.maps.Geocoder()
      const geoResult = await new Promise((resolve) => {
        geocoder.geocode({ address: cleanQ }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            resolve(results[0])
          } else {
            resolve(null)
          }
        })
      })

      if (geoResult) {
        let city = ''
        let state = ''
        for (const comp of geoResult.address_components || []) {
          if (comp.types.includes('locality')) city = comp.long_name
          if (comp.types.includes('administrative_area_level_1')) state = comp.long_name
        }

        return {
          latitude: geoResult.geometry.location.lat(),
          longitude: geoResult.geometry.location.lng(),
          displayName: geoResult.formatted_address,
          formattedAddress: geoResult.formatted_address,
          city,
          state,
        }
      }
    } catch (gErr) {
      console.warn('Google Geocoder lookup failed, trying fallback...', gErr)
    }
  }

  // 2. Try Backend Geocode Proxy
  try {
    const res = await apiClient.get(`/geocode/forward?query=${encodeURIComponent(cleanQ)}&limit=1`)
    const data = res?.data || res
    if (data && data.latitude && data.longitude) {
      return {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        displayName: data.display_name || cleanQ,
        formattedAddress: data.formatted_address || data.display_name || cleanQ,
        city: data.city || '',
        state: data.state || '',
      }
    }
  } catch (err) {
    console.warn('Backend forward geocode failed, trying direct...', err)
  }

  // 3. Direct Nominatim search
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(cleanQ)}`
    )
    if (res.ok) {
      const data = await res.json()
      if (data && data.length > 0) {
        const item = data[0]
        const addr = item.address || {}
        const street = addr.road || addr.suburb || addr.neighbourhood || addr.residential || ''
        const area = addr.suburb || addr.village || addr.town || addr.city_district || ''
        const city = addr.city || addr.town || addr.village || addr.county || ''
        const state = addr.state || ''
        const parts = Array.from(new Set([street, area, city, state].filter(Boolean)))
        const clean = parts.length > 0 ? parts.join(', ') : item.display_name
        return {
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          displayName: item.display_name,
          formattedAddress: clean,
          city,
          state,
        }
      }
    }
  } catch (err) {
    console.error('Forward geocode failed:', err)
  }

  return null
}

/**
 * Fetch auto-suggestions for typing address in search/input boxes
 */
export const fetchAddressSuggestions = async (query) => {
  if (!query || query.trim().length < 2) return []
  const cleanQ = query.trim()

  // 1. Google Places AutocompleteService (if loaded)
  if (window.google?.maps?.places?.AutocompleteService) {
    try {
      const service = new window.google.maps.places.AutocompleteService()
      const predictions = await new Promise((resolve) => {
        service.getPlacePredictions(
          { input: cleanQ, componentRestrictions: { country: 'in' } },
          (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              resolve(results)
            } else {
              resolve([])
            }
          }
        )
      })

      if (predictions && predictions.length > 0) {
        const geocoder = window.google.maps.Geocoder ? new window.google.maps.Geocoder() : null
        const resultsWithCoords = await Promise.all(
          predictions.slice(0, 5).map(async (p) => {
            let lat = null
            let lng = null
            let city = ''
            let state = ''

            if (geocoder) {
              try {
                const geoRes = await new Promise((res) => {
                  geocoder.geocode({ placeId: p.place_id }, (gResults, gStatus) => {
                    if (gStatus === 'OK' && gResults?.[0]) res(gResults[0])
                    else res(null)
                  })
                })
                if (geoRes) {
                  lat = geoRes.geometry.location.lat()
                  lng = geoRes.geometry.location.lng()
                  for (const comp of geoRes.address_components || []) {
                    if (comp.types.includes('locality')) city = comp.long_name
                    if (comp.types.includes('administrative_area_level_1')) state = comp.long_name
                  }
                }
              } catch (e) {
                // ignore
              }
            }

            return {
              latitude: lat,
              longitude: lng,
              placeId: p.place_id,
              displayName: p.description,
              formattedAddress: p.description,
              city: city || p.structured_formatting?.secondary_text?.split(',')?.[0]?.trim() || '',
              state: state,
            }
          })
        )

        return resultsWithCoords
      }
    } catch (gErr) {
      console.warn('Google Places autocomplete failed, falling back...', gErr)
    }
  }

  // 2. Try Backend Geocode Proxy
  try {
    const res = await apiClient.get(`/geocode/forward?query=${encodeURIComponent(cleanQ)}&limit=6`)
    const data = res?.data || res
    if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
      return data.results.map((item) => ({
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
        displayName: item.display_name,
        formattedAddress: item.formatted_address || item.display_name,
        city: item.city || '',
        state: item.state || '',
      }))
    }
    if (data?.latitude && data?.longitude) {
      return [{
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        displayName: data.display_name || cleanQ,
        formattedAddress: data.formatted_address || data.display_name || cleanQ,
        city: data.city || '',
        state: data.state || '',
      }]
    }
  } catch (err) {
    console.warn('Backend address suggestions failed, trying direct provider...', err)
  }

  // 3. Direct Nominatim search fallback
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=6&addressdetails=1&q=${encodeURIComponent(cleanQ)}`
    )
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        return data.map((item) => {
          const addr = item.address || {}
          const street = addr.road || addr.suburb || addr.neighbourhood || addr.residential || ''
          const area = addr.suburb || addr.village || addr.town || addr.city_district || ''
          const city = addr.city || addr.town || addr.village || addr.county || ''
          const state = addr.state || ''
          const parts = Array.from(new Set([street, area, city, state].filter(Boolean)))
          const clean = parts.length > 0 ? parts.join(', ') : item.display_name
          return {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            displayName: item.display_name,
            formattedAddress: clean,
            city,
            state,
          }
        })
      }
    }
  } catch (err) {
    console.error('Direct address suggestions failed:', err)
  }

  return []
}

/**
 * Location detection. Uses REAL device GPS (high accuracy, 12s timeout, fresh 0s cache).
 * gpsOnly=true by default to prevent dropping to inaccurate IP/network locations.
 *
 * @param {{ gpsOnly?: boolean }} opts  gpsOnly=true → never use IP; error if GPS fails.
 */
export const detectCurrentLocationWithFallback = async ({ gpsOnly = true } = {}) => {
  // Real device GPS. High accuracy + 12s timeout for accurate satellite lock.
  const tryBrowserGps = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation is not supported by your browser.'))
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            source: 'gps',
          })
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      )
    })
  }

  let coords = null
  let gpsError = null
  try {
    coords = await tryBrowserGps()
  } catch (gpsErr) {
    gpsError = gpsErr
    console.warn('Browser GPS unavailable/denied...', gpsErr)
  }

  // GPS-only mode: do NOT fall back to IP — report a clear GPS error instead.
  if (gpsOnly && !coords) {
    if (gpsError?.code === 1) {
      throw new Error('Location permission denied. Please allow location access in your browser settings.')
    } else if (gpsError?.code === 3) {
      throw new Error('GPS satellite fix timed out (12s). Please check device location settings and try again.')
    } else {
      throw new Error(gpsError?.message || 'GPS location unavailable. Please enable device GPS or place pin on map.')
    }
  }

  // Step 2: Approximate IP/network location — only when explicitly allowed and GPS failed.
  if (!coords) {
    try {
      const res = await apiClient.get('/geocode/detect-ip')
      const data = res?.data || res
      if (data && data.latitude && data.longitude) {
        coords = {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          city: data.city,
          state: data.state,
          formattedAddress: data.formatted_address,
          source: 'network',
        }
      }
    } catch (ipErr) {
      console.warn('Backend IP detection failed...', ipErr)
    }
  }

  if (!coords) {
    throw new Error('Could not detect location. Please enable GPS or drag the map pin manually.')
  }

  // Reverse geocode to get a clean address name (may be null if unresolved).
  const geo = await reverseGeocodeCoordinates(coords.latitude, coords.longitude)
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    city: geo?.city || coords.city || null,
    state: geo?.state || coords.state || null,
    formattedAddress: geo?.formattedAddress || coords.formattedAddress || null,
    source: coords.source,
  }
}

