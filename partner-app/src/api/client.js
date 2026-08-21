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
    Accept: 'application/json',
  },
  timeout: 30000,
})

export const multipartConfig = {
  timeout: 60000,
}

// Request interceptor to attach Bearer token & handle FormData
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dastak_partner_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // When sending FormData, remove Content-Type so browser sets multipart boundary automatically
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

// Response interceptor for consistent error extraction & realtime broadcast
apiClient.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toUpperCase()
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      emitRealtimeEvent('DATA_MUTATION', {
        source: 'partner-app',
        url: response.config?.url,
        method,
        timestamp: Date.now(),
      })
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dastak_partner_token')
      localStorage.removeItem('dastak_partner_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Network request failed. Please check connection.'
    
    return Promise.reject(new Error(message))
  }
)

export default apiClient
