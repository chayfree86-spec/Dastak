import apiClient from './client'

export const deliveryBoysApi = {
  getDeliveryBoys: (params) => apiClient.get('/admin/delivery-boys', { params }),
  getDeliveryBoyDetails: (id) => apiClient.get(`/admin/delivery-boys/${id}`),
  createDeliveryBoy: (data) => apiClient.post('/admin/delivery-boys', data),
  updateDeliveryBoy: (id, data) => apiClient.put(`/admin/delivery-boys/${id}`, data),
  toggleStatus: (id, statusData) => apiClient.patch(`/admin/delivery-boys/${id}/status`, statusData),
  getActiveDeliveries: (id) => apiClient.get(`/admin/delivery-boys/${id}/active-deliveries`),
  getOrderHistory: (id, params) => apiClient.get(`/admin/delivery-boys/${id}/orders`, { params }),
  getEarnings: (id, params) => apiClient.get(`/admin/delivery-boys/${id}/earnings`, { params }),
  getCodCollection: (id, params) => apiClient.get(`/admin/delivery-boys/${id}/cod-collections`, { params }),
  reconcileCod: (id, data) => apiClient.post(`/admin/delivery-boys/${id}/reconcile-cod`, data),
}

export default deliveryBoysApi
