import apiClient from './client'

export const systemLogsApi = {
  getOverview: () => apiClient.get('/admin/system-logs/overview'),
  getLogs: (params = {}) => apiClient.get('/admin/system-logs', { params }),
  getLogDetail: (id) => apiClient.get(`/admin/system-logs/${id}`),
  exportLogs: (params = {}) =>
    apiClient.get('/admin/system-logs/export', {
      params,
      responseType: 'blob',
    }),
}

export default systemLogsApi
