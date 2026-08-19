import axios from 'axios'
import { emitRealtimeEvent } from '../utils/realtimeSync'

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
})

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dastak_partner_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
