import apiClient from './client'

export const customersApi = {
  getCustomers: (params) => apiClient.get('/admin/customers', { params }),
  getCustomerDetails: (id) => apiClient.get(`/admin/customers/${id}`),
  getCustomerOrders: (id, params) => apiClient.get(`/admin/customers/${id}/orders`, { params }),
  getCustomerAddresses: (id) => apiClient.get(`/admin/customers/${id}/addresses`),
  toggleBlock: (id, data) => apiClient.patch(`/admin/customers/${id}/block-status`, data),
  getCustomerComplaints: (id) => apiClient.get(`/admin/customers/${id}/complaints`),
}

export default customersApi
