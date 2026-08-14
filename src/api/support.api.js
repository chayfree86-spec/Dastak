import apiClient from './client'

export const supportApi = {
  getTickets: (params) => apiClient.get('/admin/support/tickets', { params }),
  getTicketDetails: (id) => apiClient.get(`/admin/support/tickets/${id}`),
  sendTicketReply: (id, data) => apiClient.post(`/admin/support/tickets/${id}/replies`, data),
  updateTicketStatus: (id, data) => apiClient.patch(`/admin/support/tickets/${id}/status`, data),
}

export default supportApi
