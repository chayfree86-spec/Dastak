import apiClient from './client'

export const deliveryApi = {
  // Rider Profile & Duty status
  getProfile: () => apiClient.get('/delivery/profile'),
  updateProfile: (data) => apiClient.put('/delivery/profile', data),
  toggleDutyStatus: (isOnline) =>
    apiClient.patch('/delivery/duty-status', { is_online: isOnline }),
  updateLocation: (coords) =>
    apiClient.post('/delivery/location', {
      latitude: coords.latitude,
      longitude: coords.longitude,
    }),

  // Orders
  getAssignedOrder: () => apiClient.get('/delivery/orders/assigned'),
  getHistory: (params) => apiClient.get('/delivery/orders/history', { params }),
  pickupOrder: (orderNumber) =>
    apiClient.patch(`/delivery/orders/${orderNumber}/pickup`),
  verifyDelivery: (orderNumber, data) =>
    apiClient.post(`/delivery/orders/${orderNumber}/verify-delivery`, data),

  // COD Ledger & Deposit
  getCodLedger: (params) => apiClient.get('/delivery/cod/ledger', { params }),
  depositCod: (collectionIds) =>
    apiClient.post('/delivery/cod/deposit', { collection_ids: collectionIds }),

  // Earnings Summary & Reviews
  getSummary: () => apiClient.get('/delivery/analytics/summary'),
  getReviews: (params) => apiClient.get('/delivery/reviews', { params }),

  // Support / Issue Report
  reportIssue: (data) => apiClient.post('/customer/tickets', data),
}

export default deliveryApi
