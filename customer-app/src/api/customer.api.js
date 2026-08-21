import apiClient from './client'

export const customerApi = {
  // Public: DB-driven food-category chips for the home screen
  getFoodCategories: async () => {
    const res = await apiClient.get('/food-categories')
    return res.data
  },

  // Profile
  getProfile: async () => {
    const res = await apiClient.get('/customer/profile')
    return res.data
  },

  updateProfile: async (data) => {
    const res = await apiClient.put('/customer/profile', data)
    return res.data
  },

  changePin: async (payload) => {
    const res = await apiClient.post('/customer/profile/change-pin', payload)
    return res.data
  },

  // Saved Addresses
  getAddresses: async () => {
    const res = await apiClient.get('/customer/addresses')
    return res.data
  },

  storeAddress: async (data) => {
    const res = await apiClient.post('/customer/addresses', data)
    return res.data
  },

  updateAddress: async (addressId, data) => {
    const res = await apiClient.put(`/customer/addresses/${addressId}`, data)
    return res.data
  },

  destroyAddress: async (addressId) => {
    const res = await apiClient.delete(`/customer/addresses/${addressId}`)
    return res.data
  },

  setDefaultAddress: async (addressId) => {
    const res = await apiClient.patch(`/customer/addresses/${addressId}/default`)
    return res.data
  },

  // Cart
  getCart: async () => {
    const res = await apiClient.get('/customer/cart')
    return res.data
  },

  addItemToCart: async (menuItemId, quantity = 1, variantId = null, addonIds = []) => {
    const res = await apiClient.post('/customer/cart/items', {
      menu_item_id: menuItemId,
      quantity,
      variant_id: variantId,
      addon_ids: addonIds,
    })
    return res.data
  },

  updateCartItem: async (cartItemId, quantity) => {
    const res = await apiClient.put(`/customer/cart/items/${cartItemId}`, { quantity })
    return res.data
  },

  removeCartItem: async (cartItemId) => {
    const res = await apiClient.delete(`/customer/cart/items/${cartItemId}`)
    return res.data
  },

  clearCart: async () => {
    const res = await apiClient.delete('/customer/cart')
    return res.data
  },

  applyCoupon: async (couponCode) => {
    const res = await apiClient.post('/customer/cart/apply-coupon', { coupon_code: couponCode })
    return res.data
  },

  // Orders
  checkout: async (checkoutPayload) => {
    const res = await apiClient.post('/customer/orders/checkout', checkoutPayload)
    return res.data
  },

  getOrders: async (params = {}) => {
    const res = await apiClient.get('/customer/orders', { params })
    return res.data
  },

  getOrder: async (orderNumber) => {
    const res = await apiClient.get(`/customer/orders/${orderNumber}`)
    return res.data
  },

  getLiveTracking: async (orderNumber) => {
    const res = await apiClient.get(`/customer/orders/${orderNumber}/live-tracking`)
    return res.data
  },

  cancelOrder: async (orderNumber, reason = 'Changed my mind') => {
    const res = await apiClient.post(`/customer/orders/${orderNumber}/cancel`, { reason })
    return res.data
  },

  // Public Coupons & Promos
  getCoupons: async () => {
    const res = await apiClient.get('/coupons')
    return res.data
  },

  // Reviews
  createReview: async (reviewPayload) => {
    const res = await apiClient.post('/customer/reviews', reviewPayload)
    return res.data
  },

  getReviews: async (params = {}) => {
    const res = await apiClient.get('/customer/reviews', { params })
    return res.data
  },
}

export default customerApi
