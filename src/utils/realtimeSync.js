// Dastak Cross-App Realtime Event Bus
// Instant cross-tab & cross-app synchronization via BroadcastChannel + StorageEvent fallback + Focus revalidation

const CHANNEL_NAME = 'dastak_realtime_bus'
const STORAGE_KEY = 'dastak_realtime_mutation_event'

class RealtimeSyncBus {
  constructor() {
    this.channel = null
    this.listeners = new Set()

    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel(CHANNEL_NAME)
          this.channel.onmessage = (event) => {
            if (event?.data) {
              this.notify(event.data)
            }
          }
        }
      } catch (e) {
        console.warn('BroadcastChannel initialization error:', e)
      }

      // Storage event listener for cross-window / cross-port event handling
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const data = JSON.parse(e.newValue)
            this.notify(data)
          } catch (err) {}
        }
      })
    }
  }

  emit(eventType = 'DATA_MUTATION', payload = {}) {
    const message = {
      type: eventType,
      payload,
      timestamp: Date.now(),
    }

    if (this.channel) {
      try {
        this.channel.postMessage(message)
      } catch (e) {}
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(message))
    } catch (e) {}

    // Notify local listeners in current window
    this.notify(message)
  }

  notify(message) {
    this.listeners.forEach((listener) => {
      try {
        listener(message)
      } catch (err) {
        console.error('Realtime sync listener error:', err)
      }
    })
  }

  subscribe(callback) {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }
}

export const realtimeBus = new RealtimeSyncBus()

export const emitRealtimeEvent = (type, payload) => {
  realtimeBus.emit(type, payload)
}

export default realtimeBus
