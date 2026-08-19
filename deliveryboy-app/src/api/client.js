import axios from 'axios'
import { emitRealtimeEvent } from '../utils/realtimeSync'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
})

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dastak_delivery_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for unified error formatting & realtime sync broadcast
apiClient.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toUpperCase()
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      emitRealtimeEvent('DATA_MUTATION', {
        source: 'deliveryboy-app',
        url: response.config?.url,
        method,
        timestamp: Date.now(),
      })
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dastak_delivery_token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network error occurred'
    
    return Promise.reject(new Error(message))
  }
)

export default apiClient
