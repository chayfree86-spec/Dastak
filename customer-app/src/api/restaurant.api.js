import apiClient from './client'

export const restaurantApi = {
  getRestaurants: async (params = {}) => {
    const res = await apiClient.get('/restaurants', { params })
    return res.data
  },

  getRestaurant: async (slug) => {
    const res = await apiClient.get(`/restaurants/${slug}`)
    return res.data
  },

  getMenu: async (slug) => {
    const res = await apiClient.get(`/restaurants/${slug}/menu`)
    return res.data
  },

  getReviews: async (slug) => {
    const res = await apiClient.get(`/restaurants/${slug}/reviews`)
    return res.data
  },
}

export default restaurantApi
