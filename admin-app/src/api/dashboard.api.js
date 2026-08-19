import apiClient from './client'

export const dashboardApi = {
  getKpis: (params) => apiClient.get('/admin/dashboard/kpis', { params }),
  getOrderOverview: () => apiClient.get('/admin/dashboard/order-overview'),
  getLiveOperations: () => apiClient.get('/admin/dashboard/live-operations'),
  getRecentOrders: (params) => apiClient.get('/admin/dashboard/recent-orders', { params }),
  getSalesChart: (params) => apiClient.get('/admin/dashboard/sales-analytics', { params }),
}

export default dashboardApi
