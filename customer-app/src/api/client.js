import axios from 'axios'
import { emitRealtimeEvent } from '../utils/realtimeSync'

export const apiClient = axios.create({
  baseURL: '/api/v1',
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
