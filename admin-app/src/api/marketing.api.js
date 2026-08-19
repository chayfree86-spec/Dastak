import apiClient from './client'

export const marketingApi = {
  getCoupons: (params) => apiClient.get('/admin/marketing/coupons', { params }),
  createCoupon: (data) => apiClient.post('/admin/marketing/coupons', data),
  updateCoupon: (id, data) => apiClient.put(`/admin/marketing/coupons/${id}`, data),
  toggleCouponStatus: (id, status) => apiClient.patch(`/admin/marketing/coupons/${id}/status`, { is_active: status }),
  deleteCoupon: (id) => apiClient.delete(`/admin/marketing/coupons/${id}`),
  getBanners: () => apiClient.get('/admin/marketing/banners'),
  createBanner: (data) => apiClient.post('/admin/marketing/banners', data),
  updateBanner: (id, data) => apiClient.put(`/admin/marketing/banners/${id}`, data),
  deleteBanner: (id) => apiClient.delete(`/admin/marketing/banners/${id}`),
  sendNotification: (data) => apiClient.post('/admin/marketing/push-notifications', data),
}

export default marketingApi
