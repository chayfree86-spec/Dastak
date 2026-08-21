import apiClient, { multipartConfig } from './client'

export const deliveryBoysApi = {
  getDeliveryBoys: (params) => apiClient.get('/admin/delivery-boys', { params }),
  getDeliveryBoyDetails: (id) => apiClient.get(`/admin/delivery-boys/${id}`),
  createDeliveryBoy: (data) => apiClient.post('/admin/delivery-boys', data),
  updateDeliveryBoy: (id, data) => apiClient.put(`/admin/delivery-boys/${id}`, data),
  deleteDeliveryBoy: (id) => apiClient.delete(`/admin/delivery-boys/${id}`),
  downloadIdCard: (id) => apiClient.get(`/admin/delivery-boys/${id}/id-card`, { responseType: 'blob' }),
  // multipartConfig strips the JSON content-type (see client.js).
  uploadDocument: (formData) => apiClient.post('/admin/delivery-boys/upload-document', formData, multipartConfig),
  toggleStatus: (id, statusData) => apiClient.patch(`/admin/delivery-boys/${id}/status`, statusData),
  getActiveDeliveries: (id) => apiClient.get(`/admin/delivery-boys/${id}/active-deliveries`),
  getOrderHistory: (id, params) => apiClient.get(`/admin/delivery-boys/${id}/orders`, { params }),
  getEarnings: (id, params) => apiClient.get(`/admin/delivery-boys/${id}/earnings`, { params }),
  getCodCollection: (id, params) => apiClient.get(`/admin/delivery-boys/${id}/cod-collections`, { params }),
  reconcileCod: (id, data) => apiClient.post(`/admin/delivery-boys/${id}/reconcile-cod`, data),
}

export default deliveryBoysApi
