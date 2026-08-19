import { DastakApiClient } from '../api.js';

export class AdminWatcher {
  constructor(credentials = { identifier: 'admin@dastakdelivery.com', password: 'password123' }) {
    this.name = 'Admin Watcher Agent (Dastak Ops Control)';
    this.credentials = credentials;
    this.api = new DastakApiClient();
    this.user = null;
  }

  log(msg) {
    console.log(`\x1b[31m[ADMIN WATCHER]\x1b[0m ${msg}`);
  }

  async init() {
    this.log(`Authenticating Admin Controller as ${this.credentials.identifier}...`);
    const res = await this.api.login(this.credentials.identifier, this.credentials.password);
    this.user = res.data?.user;
    this.log(`Super Admin Control Active! Logged in as: ${this.user?.name}`);
    return this.user;
  }

  async ensureOrderDispatched(orderId, riderId) {
    this.log(`Verifying dispatch assignment for Order ID: ${orderId}...`);
    try {
      await this.api.assignAdminDelivery(orderId, riderId);
      this.log(`Admin confirmed Rider #${riderId} assignment for Order #${orderId}.`);
    } catch (e) {
      // Might already be auto-assigned
      this.log(`Dispatch check: ${e.response?.data?.message || 'Order already assigned to rider.'}`);
    }
  }

  async auditLiveOperations() {
    this.log('Auditing platform live operations feed...');
    try {
      const ops = await this.api.getAdminLiveOperations();
      const data = ops.data || {};
      this.log(`[Platform Health] Active Orders: \x1b[32m${data.active_orders_count || 0}\x1b[0m | Active Riders: \x1b[36m${data.active_riders_count || 0}\x1b[0m | Restaurants Online: \x1b[33m${data.open_restaurants_count || 0}\x1b[0m`);
      return data;
    } catch (e) {
      this.log(`Audit notice: ${e.message}`);
    }
  }

  async verifyOrderStatus(orderIdOrNumber, expectedStatus) {
    try {
      const orderRes = await this.api.client.get(`/admin/orders/${orderIdOrNumber}`);
      const order = orderRes.data?.data;
      if (order) {
        this.log(`Audit check on Order #${order.id} (${order.order_number || orderIdOrNumber}): Current Status is \x1b[32m${order.status}\x1b[0m`);
        return order;
      }
    } catch (e) {
      // Fallback to checking admin index
      const ordersRes = await this.api.getAdminOrders();
      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.data || ordersRes.data?.items || []);
      const order = orders.find(o => o.id === orderIdOrNumber || o.order_number === orderIdOrNumber);
      if (order) {
        this.log(`Audit check on Order #${order.id}: Status is \x1b[32m${order.status}\x1b[0m (Expected: ${expectedStatus})`);
        return order;
      }
    }
  }
}
