import apiClient from './client'

export const financeApi = {
  getFinanceSummary: (params) => apiClient.get('/admin/finance/summary', { params }),
  getSettlements: (params) => apiClient.get('/admin/finance/settlements', { params }),
  processSettlement: (settlementId, data) => apiClient.post(`/admin/finance/settlements/${settlementId}/process`, data),
  getRestaurantCommissions: (params) => apiClient.get('/admin/finance/commissions', { params }),
  updateRestaurantCommission: (restaurantId, data) => apiClient.put(`/admin/finance/commissions/${restaurantId}`, data),
  getDeliveryCharges: () => apiClient.get('/admin/finance/delivery-charge-rules'),
  updateDeliveryCharges: (rules) => apiClient.put('/admin/finance/delivery-charge-rules', { rules }),
  getCodReports: (params) => apiClient.get('/admin/finance/cod-reports', { params }),
  getRefunds: (params) => apiClient.get('/admin/finance/refunds', { params }),
}

export default financeApi
