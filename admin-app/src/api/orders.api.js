import apiClient from './client'

export const ordersApi = {
  getOrders: (params) => apiClient.get('/admin/orders', { params }),
  getOrderDetails: (orderId) => apiClient.get(`/admin/orders/${orderId}`),
  updateOrderStatus: (orderId, statusData) => apiClient.patch(`/admin/orders/${orderId}/status`, statusData),
  assignDeliveryBoy: (orderId, assignmentData) => apiClient.post(`/admin/orders/${orderId}/assign-delivery`, assignmentData),
  reassignDeliveryBoy: (orderId, assignmentData) => apiClient.post(`/admin/orders/${orderId}/reassign-delivery`, assignmentData),
  cancelOrder: (orderId, cancelData) => apiClient.post(`/admin/orders/${orderId}/cancel`, cancelData),
  getOrderTimeline: (orderId) => apiClient.get(`/admin/orders/${orderId}/timeline`),
}

export default ordersApi
