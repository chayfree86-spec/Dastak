import apiClient, { multipartConfig } from './client'
import { compressImage } from '../utils/imageCompressor'

export const restaurantsApi = {
  getRestaurants: (params) => apiClient.get('/admin/restaurants', { params }),
  getRestaurantDetails: (id) => apiClient.get(`/admin/restaurants/${id}`),
  createRestaurant: (data) => apiClient.post('/admin/restaurants', data),

  // Flexible logo/banner upload (any image, any size) -> returns { url }
  uploadRestaurantImage: async (file) => {
    const optimized = await compressImage(file)
    const fd = new FormData()
    fd.append('image', optimized)
    return apiClient.post('/admin/restaurants/upload-image', fd, multipartConfig)
  },
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

  // Flexible image upload & search
  searchFoodImages: (restaurantId, query) => apiClient.get(`/admin/restaurants/${restaurantId}/menu/search-food-images`, { params: { q: query } }),
  uploadMenuImage: async (restaurantId, fileOrUrl) => {
    if (typeof fileOrUrl === 'string' && fileOrUrl.startsWith('http')) {
      return apiClient.post(`/admin/restaurants/${restaurantId}/menu/upload-image`, { image_url: fileOrUrl })
    }
    const optimized = await compressImage(fileOrUrl)
    const fd = new FormData()
    fd.append('image', optimized)
    return apiClient.post(`/admin/restaurants/${restaurantId}/menu/upload-image`, fd, multipartConfig)
  },
  getRestaurantEarnings: (id, params) => apiClient.get(`/admin/restaurants/${id}/earnings`, { params }),
  getRestaurantSettlements: (id, params) => apiClient.get(`/admin/restaurants/${id}/settlements`, { params }),
}

export default restaurantsApi
