import apiClient from './client'

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  me: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
  changePassword: (data) => apiClient.post('/auth/change-password', data),
}

export default authApi
