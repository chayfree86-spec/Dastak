import apiClient from './client'

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
  uploadImage: (file) => {
    const fd = new FormData()
    fd.append('image', file)
    return apiClient.post('/partner/menu/upload-image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export default menuApi
