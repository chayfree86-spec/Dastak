import apiClient from './client'

export const reportsApi = {
  getDashboard: () => apiClient.get('/partner/analytics/dashboard'),
  getReports: (params) => apiClient.get('/partner/analytics/reports', { params }),
  getSettlements: (params) => apiClient.get('/partner/settlements', { params }),
}

export default reportsApi
