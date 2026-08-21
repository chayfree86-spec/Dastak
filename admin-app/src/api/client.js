import axios from 'axios'
import { emitRealtimeEvent } from '../utils/realtimeSync'

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('dastak.cc')) {
    return 'https://api.dastak.cc/api/v1'
  }
  return '/api/v1'
}

const API_BASE_URL = getApiBaseUrl()

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
})

/**
 * Request config for FormData / file uploads (longer timeout).
 */
export const multipartConfig = {
  timeout: 60000,
}

// Request Interceptor: Attach Auth Token & Handle FormData headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dastak_admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // When sending FormData, remove Content-Type so browser sets boundary automatically
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type']
        delete config.headers['content-type']
        if (typeof config.headers.delete === 'function') {
          config.headers.delete('Content-Type')
          config.headers.delete('content-type')
        }
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Global Error, Session Expiry & Realtime Sync Broadcast
apiClient.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toUpperCase()
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      emitRealtimeEvent('DATA_MUTATION', {
        source: 'admin-app',
        url: response.config?.url,
        method,
        timestamp: Date.now(),
      })
    }
    return response.data
  },
  (error) => {
    const status = error.response ? error.response.status : null

    if (status === 401) {
      const token = localStorage.getItem('dastak_admin_token')
      if (token) {
        localStorage.removeItem('dastak_admin_token')
        localStorage.removeItem('dastak_admin_user')
        // Dispatch custom event for session expired
        window.dispatchEvent(new CustomEvent('dastak:session_expired'))
      }
    }

    const customError = {
      status,
      message: error.response?.data?.message || error.message || 'An unexpected error occurred. Please try again.',
      errors: error.response?.data?.errors || null,
      isNetworkError: !error.response,
    }

    return Promise.reject(customError)
  }
)

export default apiClient
