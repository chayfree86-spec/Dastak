/**
 * Loads the Google Maps JavaScript API (+ Places library) exactly once and
 * shares the same promise across every component that needs the map.
 */
let loaderPromise = null

export const loadGoogleMaps = () => {
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (loaderPromise) return loaderPromise

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  loaderPromise = new Promise((resolve, reject) => {
    if (!apiKey) {
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set.'))
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding&loading=async&callback=__dastakGoogleMapsReady`
    script.async = true
    script.defer = true

    window.__dastakGoogleMapsReady = () => resolve(window.google.maps)
    script.onerror = () => reject(new Error('Failed to load Google Maps script.'))

    document.head.appendChild(script)
  })

  return loaderPromise
}

export default loadGoogleMaps
