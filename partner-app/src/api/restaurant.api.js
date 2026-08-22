import apiClient from './client'

export const restaurantApi = {
  getProfile: () => apiClient.get('/partner/restaurant'),
  getRestaurant: () => apiClient.get('/partner/restaurant'),
  updateProfile: (data) => apiClient.put('/partner/restaurant', data),
  updateRestaurant: (data) => apiClient.put('/partner/restaurant', data),
  toggleOpen: (isOpen) => apiClient.patch('/partner/restaurant/toggle-open', { is_open: isOpen }),
  toggleOpenStatus: (isOpen) => apiClient.patch('/partner/restaurant/toggle-open', { is_open: isOpen }),
  updateOperatingHours: (hours) => apiClient.put('/partner/restaurant/operating-hours', { hours }),
  updateBankAccount: (data) => apiClient.put('/partner/restaurant/bank-account', data),
  getConfig: () => apiClient.get('/config'),
}

export default restaurantApi
