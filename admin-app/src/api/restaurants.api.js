import apiClient from './client'

export const restaurantsApi = {
  getRestaurants: (params) => apiClient.get('/admin/restaurants', { params }),
  getRestaurantDetails: (id) => apiClient.get(`/admin/restaurants/${id}`),
  createRestaurant: (data) => apiClient.post('/admin/restaurants', data),
  updateRestaurant: (id, data) => apiClient.put(`/admin/restaurants/${id}`, data),
  updateOperatingHours: (id, hours) => apiClient.put(`/admin/restaurants/${id}/operating-hours`, { hours }),
  toggleStatus: (id, statusData) => apiClient.patch(`/admin/restaurants/${id}/status`, statusData),
  getRestaurantOrders: (id, params) => apiClient.get(`/admin/restaurants/${id}/orders`, { params }),
  getRestaurantMenu: (id) => apiClient.get(`/admin/restaurants/${id}/menu`),

  // Categories & sub-categories
  createMenuCategory: (restaurantId, data) => apiClient.post(`/admin/restaurants/${restaurantId}/menu/categories`, data),
  updateMenuCategory: (restaurantId, categoryId, data) => apiClient.put(`/admin/restaurants/${restaurantId}/menu/categories/${categoryId}`, data),
  deleteMenuCategory: (restaurantId, categoryId) => apiClient.delete(`/admin/restaurants/${restaurantId}/menu/categories/${categoryId}`),

  // Items
  createMenuItem: (restaurantId, itemData) => apiClient.post(`/admin/restaurants/${restaurantId}/menu/items`, itemData),
  updateMenuItem: (restaurantId, itemId, itemData) => apiClient.put(`/admin/restaurants/${restaurantId}/menu/items/${itemId}`, itemData),
  deleteMenuItem: (restaurantId, itemId) => apiClient.delete(`/admin/restaurants/${restaurantId}/menu/items/${itemId}`),
  toggleMenuItemAvailability: (restaurantId, itemId, availability) => apiClient.patch(`/admin/restaurants/${restaurantId}/menu/items/${itemId}/availability`, { is_available: availability }),

  // Flexible image upload (any image, any size) -> returns { url }
  uploadMenuImage: (restaurantId, file) => {
    const fd = new FormData()
    fd.append('image', file)
    return apiClient.post(`/admin/restaurants/${restaurantId}/menu/upload-image`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getRestaurantEarnings: (id, params) => apiClient.get(`/admin/restaurants/${id}/earnings`, { params }),
  getRestaurantSettlements: (id, params) => apiClient.get(`/admin/restaurants/${id}/settlements`, { params }),
}

export default restaurantsApi
