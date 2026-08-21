import apiClient, { multipartConfig } from './client'
import { compressImage } from '../utils/imageCompressor'

export const menuApi = {
  getMenuTree: () => apiClient.get('/partner/menu/tree'),
  getCategories: () => apiClient.get('/partner/menu/categories'),
  createCategory: (data) => apiClient.post('/partner/menu/categories', data),
  updateCategory: (id, data) => apiClient.put(`/partner/menu/categories/${id}`, data),
  deleteCategory: (id) => apiClient.delete(`/partner/menu/categories/${id}`),

  getItems: (params) => apiClient.get('/partner/menu/items', { params }),
  getItem: (id) => apiClient.get(`/partner/menu/items/${id}`),
  createItem: (data) => apiClient.post('/partner/menu/items', data),
  updateItem: (id, data) => apiClient.put(`/partner/menu/items/${id}`, data),
  deleteItem: (id) => apiClient.delete(`/partner/menu/items/${id}`),
  toggleAvailability: (id, isAvailable) =>
    apiClient.patch(`/partner/menu/items/${id}/availability`, { is_available: isAvailable }),
  searchFoodImages: (query) => apiClient.get('/partner/menu/search-food-images', { params: { q: query } }),
  uploadImage: async (fileOrUrl) => {
    if (typeof fileOrUrl === 'string' && fileOrUrl.startsWith('http')) {
      return apiClient.post('/partner/menu/upload-image', { image_url: fileOrUrl })
    }
    const optimized = await compressImage(fileOrUrl)
    const fd = new FormData()
    fd.append('image', optimized)
    return apiClient.post('/partner/menu/upload-image', fd, multipartConfig)
  },
}

export default menuApi
