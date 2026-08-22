import apiClient from './client'

export const settingsApi = {
  getSettings: () => apiClient.get('/admin/settings/general'),
  updateSettings: (data) => apiClient.put('/admin/settings/general', data),
  uploadLogo: (formData) =>
    apiClient.post('/admin/settings/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getOrderSettings: () => apiClient.get('/admin/settings/orders'),
  updateOrderSettings: (data) => apiClient.put('/admin/settings/orders', data),
  getDeliverySettings: () => apiClient.get('/admin/settings/delivery'),
  updateDeliverySettings: (data) => apiClient.put('/admin/settings/delivery', data),
  getPaymentSettings: () => apiClient.get('/admin/settings/payments'),
  updatePaymentSettings: (data) => apiClient.put('/admin/settings/payments', data),
  getNotificationSettings: () => apiClient.get('/admin/settings/notifications'),
  updateNotificationSettings: (data) => apiClient.put('/admin/settings/notifications', data),
  getStoreHours: () => apiClient.get('/admin/settings/store-hours'),
  updateStoreHours: (data) => apiClient.put('/admin/settings/store-hours', data),
  // Public ordering-availability status (no special permission needed) — used by the header badge
  getServiceStatus: () => apiClient.get('/service-status'),
  getServiceAreas: () => apiClient.get('/admin/settings/service-areas'),
  createServiceArea: (data) => apiClient.post('/admin/settings/service-areas', data),
  updateServiceArea: (id, data) => apiClient.put(`/admin/settings/service-areas/${id}`, data),
  deleteServiceArea: (id) => apiClient.delete(`/admin/settings/service-areas/${id}`),
}

export default settingsApi
