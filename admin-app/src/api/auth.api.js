import apiClient from './client'

export const authApi = {
  login: (credentials) => apiClient.post('/admin/auth/login', credentials),
  logout: () => apiClient.post('/admin/auth/logout'),
  getProfile: () => apiClient.get('/admin/auth/profile'),
  forgotPassword: (data) => apiClient.post('/admin/auth/forgot-password', data),
  resetPassword: (data) => apiClient.post('/admin/auth/reset-password', data),
  updateProfile: (data) => apiClient.put('/admin/auth/profile', data),
  changePassword: (data) => apiClient.put('/admin/auth/change-password', data),
}

export default authApi
