import axios from 'axios';

const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export class DastakApiClient {
  constructor(token = null) {
    this.token = token;
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      timeout: 10000,
    });
  }

  setToken(token) {
    this.token = token;
    this.client.defaults.headers['Authorization'] = `Bearer ${token}`;
  }

  // Auth
  async login(identifier, password) {
    const res = await this.client.post('/auth/login', {
      identifier,
      password,
      device_name: 'Dastak-Simulation-Agent'
    });
    const token = res.data?.data?.token;
    if (token) {
      this.setToken(token);
    }
    return res.data;
  }

  // Customer endpoints
  async getRestaurants() {
    const res = await this.client.get('/restaurants');
    return res.data;
  }

  async getRestaurantMenu(slug) {
    const res = await this.client.get(`/restaurants/${slug}/menu`);
    return res.data;
  }

  async getCustomerAddresses() {
    const res = await this.client.get('/customer/addresses');
    return res.data;
  }

  async checkoutOrder(payload) {
    const res = await this.client.post('/customer/orders/checkout', payload);
    return res.data;
  }

  async getCustomerOrderTracking(orderNumber) {
    const res = await this.client.get(`/customer/orders/${orderNumber}/live-tracking`);
    return res.data;
  }

  // Partner endpoints
  async getPartnerOrders(status = null) {
    const params = status ? { status } : {};
    const res = await this.client.get('/partner/orders', { params });
    return res.data;
  }

  async acceptPartnerOrder(orderNumber, prepTime = 15) {
    const res = await this.client.patch(`/partner/orders/${orderNumber}/accept`, {
      prep_time_minutes: prepTime
    });
    return res.data;
  }

  async markPartnerOrderPreparing(orderNumber) {
    const res = await this.client.patch(`/partner/orders/${orderNumber}/preparing`);
    return res.data;
  }

  async markPartnerOrderReady(orderNumber) {
    const res = await this.client.patch(`/partner/orders/${orderNumber}/ready`);
    return res.data;
  }

  // Delivery Rider endpoints
  async setRiderDutyStatus(isOnline = true) {
    const res = await this.client.patch('/delivery/duty-status', { is_online: isOnline });
    return res.data;
  }

  async getRiderAssignedOrder() {
    const res = await this.client.get('/delivery/orders/assigned');
    return res.data;
  }

  async pickupRiderOrder(orderNumber) {
    const res = await this.client.patch(`/delivery/orders/${orderNumber}/pickup`);
    return res.data;
  }

  async updateRiderLocation(lat, lng) {
    const res = await this.client.post('/delivery/location', {
      latitude: lat,
      longitude: lng,
      speed: 25.5,
      heading: 90
    });
    return res.data;
  }

  async verifyRiderDelivery(orderNumber, otp) {
    const res = await this.client.post(`/delivery/orders/${orderNumber}/verify-delivery`, { otp });
    return res.data;
  }

  // Admin endpoints
  async getAdminLiveOperations() {
    const res = await this.client.get('/admin/dashboard/live-operations');
    return res.data;
  }

  async getAdminOrders(params = {}) {
    const res = await this.client.get('/admin/orders', { params });
    return res.data;
  }

  async getAdminDeliveryBoys() {
    const res = await this.client.get('/admin/delivery-boys');
    return res.data;
  }

  async assignAdminDelivery(orderId, riderId) {
    const res = await this.client.post(`/admin/orders/${orderId}/assign-delivery`, {
      delivery_boy_id: riderId
    });
    return res.data;
  }
}
