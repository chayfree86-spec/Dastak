import apiClient from './client'

export const authApi = {
  login: async (identifier, password) => {
    const res = await apiClient.post('/auth/login', { identifier, password })
    return res.data
  },

  getMe: async () => {
    const res = await apiClient.get('/auth/me')
    return res.data
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch (e) {}
    localStorage.removeItem('dastak_customer_token')
    localStorage.removeItem('dastak_customer_user')
  },
}

export default authApi
