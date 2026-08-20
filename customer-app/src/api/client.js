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
  timeout: 15000,
})

// Request Interceptor: Attach Sanctum Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dastak_customer_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toUpperCase()
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      emitRealtimeEvent('DATA_MUTATION', {
        source: 'customer-app',
        url: response.config?.url,
        method,
        timestamp: Date.now(),
      })
    }
    return response
  },
  (error) => {
    const status = error.response?.status
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred.'

    if (status === 401) {
      localStorage.removeItem('dastak_customer_token')
      localStorage.removeItem('dastak_customer_user')
    }

    return Promise.reject(new Error(message))
  }
)

export default apiClient
