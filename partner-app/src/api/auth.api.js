import apiClient from './client'
import { getDeviceId, getDeviceName, getDevicePlatform } from '../utils/device'

export const authApi = {
  // Restaurant Partner Device Authentication
  startVerification: (mobile) =>
    apiClient.post('/partner/auth/start', {
      mobile,
      device_id: getDeviceId(),
      device_name: getDeviceName(),
      device_platform: getDevicePlatform(),
    }),

  resendOtp: (sessionId) =>
    apiClient.post('/partner/auth/resend-otp', {
      session_id: sessionId,
      device_id: getDeviceId(),
    }),

  verifyOtp: (sessionId, otp, name = null) =>
    apiClient.post('/partner/auth/verify', {
      session_id: sessionId,
      otp,
      device_id: getDeviceId(),
      device_name: getDeviceName(),
      name,
    }),

  validateSession: (sessionToken) =>
    apiClient.post('/partner/auth/session', {
      session_token: sessionToken,
      device_id: getDeviceId(),
    }),

  changeDevice: () =>
    apiClient.post('/partner/auth/change-device', {
      device_id: getDeviceId(),
    }),

  login: (credentials) =>
    apiClient.post('/auth/login', {
      ...credentials,
      device_name: 'Dastak Partner Web/PWA',
    }),

  me: () => apiClient.get('/auth/me'),

  logout: async () => {
    try {
      await apiClient.post('/partner/auth/logout', {
        device_id: getDeviceId(),
      })
    } catch (e) {}
    localStorage.removeItem('dastak_partner_token')
    localStorage.removeItem('dastak_partner_session_token')
    localStorage.removeItem('dastak_partner_user')
  },

  changePassword: (data) => apiClient.post('/auth/change-password', data),
}

export default authApi
