import apiClient from './client'

export const searchApi = {
  search: async (query, restaurantId = null, limit = 30) => {
    const res = await apiClient.get('/search', {
      params: { q: query, restaurant_id: restaurantId, limit },
    })
    return res.data
  },

  getSuggestions: async (partial = '') => {
    const res = await apiClient.get('/search/suggestions', {
      params: { q: partial },
    })
    return res.data
  },
}

export default searchApi
