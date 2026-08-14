import apiClient from './client'

export const restaurantsApi = {
  getRestaurants: (params) => apiClient.get('/admin/restaurants', { params }),
  getRestaurantDetails: (id) => apiClient.get(`/admin/restaurants/${id}`),
  createRestaurant: (data) => apiClient.post('/admin/restaurants', data),
  updateRestaurant: (id, data) => apiClient.put(`/admin/restaurants/${id}`, data),
  toggleStatus: (id, statusData) => apiClient.patch(`/admin/restaurants/${id}/status`, statusData),
  getRestaurantOrders: (id, params) => apiClient.get(`/admin/restaurants/${id}/orders`, { params }),
  getRestaurantMenu: (id) => apiClient.get(`/admin/restaurants/${id}/menu`),
  createMenuItem: (restaurantId, itemData) => apiClient.post(`/admin/restaurants/${restaurantId}/menu/items`, itemData),
  updateMenuItem: (restaurantId, itemId, itemData) => apiClient.put(`/admin/restaurants/${restaurantId}/menu/items/${itemId}`, itemData),
  toggleMenuItemAvailability: (restaurantId, itemId, availability) => apiClient.patch(`/admin/restaurants/${restaurantId}/menu/items/${itemId}/availability`, { is_available: availability }),
  getRestaurantEarnings: (id, params) => apiClient.get(`/admin/restaurants/${id}/earnings`, { params }),
  getRestaurantSettlements: (id, params) => apiClient.get(`/admin/restaurants/${id}/settlements`, { params }),
}

export default restaurantsApi
