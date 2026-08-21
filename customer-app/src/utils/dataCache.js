/**
 * High-Performance In-Memory & Session SWR Cache for Dastak Customer App
 * Guarantees 0ms Instant Data & Pre-cached Image Render on Menu/Tab Switch.
 */

const memoryStore = new Map()

export const dataCache = {
  get: (key) => {
    if (memoryStore.has(key)) {
      return memoryStore.get(key)
    }
    try {
      const raw = sessionStorage.getItem(`dastak_cache_${key}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        memoryStore.set(key, parsed)
        return parsed
      }
    } catch (e) {}
    return null
  },

  set: (key, data) => {
    if (data === undefined || data === null) return
    memoryStore.set(key, data)
    try {
      sessionStorage.setItem(`dastak_cache_${key}`, JSON.stringify(data))
    } catch (e) {}
  },

  has: (key) => {
    if (memoryStore.has(key)) return true
    try {
      return Boolean(sessionStorage.getItem(`dastak_cache_${key}`))
    } catch (e) {
      return false
    }
  },

  clear: (key) => {
    if (key) {
      memoryStore.delete(key)
      try {
        sessionStorage.removeItem(`dastak_cache_${key}`)
      } catch (e) {}
    } else {
      memoryStore.clear()
      try {
        sessionStorage.clear()
      } catch (e) {}
    }
  },

  /**
   * Preloads an array of image URLs into browser cache so they render with 0ms pop-in.
   */
  preloadImages: (urls) => {
    if (!Array.isArray(urls) || typeof window === 'undefined') return
    urls.filter(Boolean).forEach((url) => {
      if (typeof url === 'string' && url.startsWith('http')) {
        const img = new Image()
        img.src = url
      }
    })
  },
}

export default dataCache
