import apiClient from './client'
import { getDeviceId, getDeviceName, getDevicePlatform } from '../utils/device'

export const authApi = {
  // Mobile Verification + Device Binding
  startVerification: async (mobile) => {
    const res = await apiClient.post('/customer/auth/start', {
      mobile,
      device_id: getDeviceId(),
      device_name: getDeviceName(),
      device_platform: getDevicePlatform(),
    })
    return res.data
  },

  resendOtp: async (sessionId) => {
    const res = await apiClient.post('/customer/auth/resend-otp', {
      session_id: sessionId,
      device_id: getDeviceId(),
    })
    return res.data
  },

  verifyOtp: async (sessionId, otp, name = null, pin = null) => {
    const res = await apiClient.post('/customer/auth/verify', {
      session_id: sessionId,
      otp,
      device_id: getDeviceId(),
      device_name: getDeviceName(),
      name,
      pin,
    })
    return res.data
  },

  verifyPin: async (sessionId, pin) => {
    const res = await apiClient.post('/customer/auth/verify-pin', {
      session_id: sessionId,
      pin,
      device_id: getDeviceId(),
      device_name: getDeviceName(),
    })
    return res.data
  },

  validateSession: async (sessionToken) => {
    const res = await apiClient.post('/customer/auth/session', {
      session_token: sessionToken,
      device_id: getDeviceId(),
    })
    return res.data
  },

  changeDevice: async () => {
    const res = await apiClient.post('/customer/auth/change-device', {
      device_id: getDeviceId(),
    })
    return res.data
  },

  getMe: async () => {
    const res = await apiClient.get('/auth/me')
    return res.data
  },

  logout: async () => {
    try {
      await apiClient.post('/customer/auth/logout', {
        device_id: getDeviceId(),
      })
    } catch (e) {}
    localStorage.removeItem('dastak_customer_token')
    localStorage.removeItem('dastak_customer_session_token')
    localStorage.removeItem('dastak_customer_user')
  },
}

export default authApi
