import apiClient from './client'

export const ordersApi = {
  getOrders: (params) => apiClient.get('/partner/orders', { params }),
  getOrderDetails: (orderNumber) => apiClient.get(`/partner/orders/${orderNumber}`),
  acceptOrder: (orderNumber, data) => apiClient.patch(`/partner/orders/${orderNumber}/accept`, data),
  markPreparing: (orderNumber) => apiClient.patch(`/partner/orders/${orderNumber}/preparing`),
  markReady: (orderNumber) => apiClient.patch(`/partner/orders/${orderNumber}/ready`),
  rejectOrder: (orderNumber, data) => apiClient.patch(`/partner/orders/${orderNumber}/reject`, data),
}

export default ordersApi
