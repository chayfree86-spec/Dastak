import apiClient from './client'

export const customersApi = {
  getCustomers: (params) => apiClient.get('/admin/customers', { params }),
  getCustomerDetails: (id) => apiClient.get(`/admin/customers/${id}`),
  getCustomerOrders: (id, params) => apiClient.get(`/admin/customers/${id}/orders`, { params }),
  getCustomerAddresses: (id) => apiClient.get(`/admin/customers/${id}/addresses`),
  toggleBlock: (id, data) => apiClient.patch(`/admin/customers/${id}/block-status`, data),
  toggleBlockStatus: (id, data) => apiClient.patch(`/admin/customers/${id}/block-status`, data),
  getCustomerComplaints: (id) => apiClient.get(`/admin/customers/${id}/complaints`),
  getDeviceSession: (id) => apiClient.get(`/admin/customers/${id}/device-session`),
  revokeDevice: (id, data = {}) => apiClient.post(`/admin/customers/${id}/revoke-device`, data),
  revokeDeviceByMobile: (data) => apiClient.post('/admin/customers/revoke-device-by-mobile', data),
}

export default customersApi
