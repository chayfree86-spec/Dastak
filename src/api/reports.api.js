import apiClient from './client'

export const reportsApi = {
  getReportData: (reportType, params) => apiClient.get(`/admin/reports/${reportType}`, { params }),
  exportReportCsv: (reportType, params) => apiClient.get(`/admin/reports/${reportType}/export-csv`, { params, responseType: 'blob' }),
  exportReportExcel: (reportType, params) => apiClient.get(`/admin/reports/${reportType}/export-excel`, { params, responseType: 'blob' }),
}

export default reportsApi
