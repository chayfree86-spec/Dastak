import apiClient from './client'

const BASE = '/admin/marketing/food-categories'

export const foodCategoriesApi = {
  getCategories: () => apiClient.get(BASE),
  createCategory: (data) => apiClient.post(BASE, data),
  updateCategory: (id, data) => apiClient.put(`${BASE}/${id}`, data),
  toggleStatus: (id, isActive) => apiClient.patch(`${BASE}/${id}/status`, { is_active: isActive }),
  deleteCategory: (id) => apiClient.delete(`${BASE}/${id}`),

  // Flexible image upload (any image) -> returns { url }
  uploadImage: (file) => {
    const fd = new FormData()
    fd.append('image', file)
    return apiClient.post(`${BASE}/upload-image`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export default foodCategoriesApi
