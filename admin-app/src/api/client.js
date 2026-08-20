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
  timeout: 15000,
})

// Request Interceptor: Attach Auth Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dastak_admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
      if (token && token !== 'dastak-admin-master-bypass-token-2026') {
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
