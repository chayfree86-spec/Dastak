import apiClient, { multipartConfig } from './client'
import { compressImage } from '../utils/imageCompressor'

const BASE = '/admin/marketing/food-categories'

export const foodCategoriesApi = {
  getCategories: () => apiClient.get(BASE),
  createCategory: (data) => apiClient.post(BASE, data),
  updateCategory: (id, data) => apiClient.put(`${BASE}/${id}`, data),
  reorderCategories: (orders) => apiClient.post(`${BASE}/reorder`, { orders }),
  toggleStatus: (id, isActive) => apiClient.patch(`${BASE}/${id}/status`, { is_active: isActive }),
  deleteCategory: (id) => apiClient.delete(`${BASE}/${id}`),

  // Flexible image upload (any image) -> returns { url }
  uploadImage: async (file) => {
    const optimized = await compressImage(file)
    const fd = new FormData()
    fd.append('image', optimized)
    return apiClient.post(`${BASE}/upload-image`, fd, multipartConfig)
  },
}

export default foodCategoriesApi
