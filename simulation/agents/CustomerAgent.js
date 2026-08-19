import { DastakApiClient } from '../api.js';

export class CustomerAgent {
  constructor(credentials = { identifier: 'priya@gmail.com', password: 'password123' }) {
    this.name = 'Customer Agent (Priya Sharma)';
    this.credentials = credentials;
    this.api = new DastakApiClient();
    this.user = null;
    this.activeOrder = null;
  }

  log(msg) {
    console.log(`\x1b[36m[CUSTOMER AGENT]\x1b[0m ${msg}`);
  }

  async init() {
    this.log(`Authenticating as ${this.credentials.identifier}...`);
    const res = await this.api.login(this.credentials.identifier, this.credentials.password);
    this.user = res.data?.user;
    this.log(`Logged in successfully! User ID: ${this.user?.id} (${this.user?.name})`);
    return this.user;
  }

  async placeOrder() {
    this.log('Browsing available restaurants...');
    const restRes = await this.api.getRestaurants();
    const restaurants = restRes.data?.data || restRes.data || [];
    if (restaurants.length === 0) {
      throw new Error('No open/active restaurants found!');
    }

    // Prefer Dastak Biryani Mahal so Partner Agent (Mohd. Tariq) matches
    let selectedRest = restaurants.find(r => r.name.toLowerCase().includes('biryani')) || restaurants[0];
    this.log(`Selected restaurant: "${selectedRest.name}" (Slug: ${selectedRest.slug}, ID: ${selectedRest.id})`);

    this.log(`Fetching menu for "${selectedRest.name}"...`);
    const menuRes = await this.api.getRestaurantMenu(selectedRest.slug);
    const categories = Array.isArray(menuRes.data) ? menuRes.data : (menuRes.data?.data || menuRes.data?.categories || []);
    let selectedItem = null;

    for (const cat of categories) {
      const items = cat.items || cat.menu_items || [];
      if (items.length > 0) {
        selectedItem = items[0];
        break;
      }
    }

    if (!selectedItem) {
      throw new Error(`No available menu items in restaurant "${selectedRest.name}"!`);
    }

    this.log(`Selected item: "${selectedItem.name}" (Price: ₹${selectedItem.base_price})`);

    // Fetch address
    const addrRes = await this.api.getCustomerAddresses();
    const addresses = addrRes.data || [];
    let addressId = addresses[0]?.id;

    const payload = {
      restaurant_id: selectedRest.id,
      delivery_address_id: addressId,
      items: [
        {
          menu_item_id: selectedItem.id,
          quantity: 2,
          instructions: 'Extra spicy please.'
        }
      ],
      payment_mode: 'COD',
      special_instructions: 'Please ring bell upon arrival'
    };

    this.log(`Placing order (COD, 2x ${selectedItem.name})...`);
    const orderRes = await this.api.checkoutOrder(payload);
    this.activeOrder = orderRes.data?.data || orderRes.data;
    
    this.log(`Order placed successfully! Order #: \x1b[32m${this.activeOrder.order_number}\x1b[0m, OTP: \x1b[33m${this.activeOrder.delivery_otp}\x1b[0m, Total: ₹${this.activeOrder.bill?.total_amount || this.activeOrder.total_amount}`);
    return this.activeOrder;
  }

  async checkTracking(orderNumber) {
    const res = await this.api.getCustomerOrderTracking(orderNumber);
    const tracking = res.data?.data || res.data || {};
    this.log(`Live Tracking - Status: \x1b[35m${tracking.status || tracking.status_label || 'In Progress'}\x1b[0m, Rider: ${tracking.delivery_boy?.name || 'Assigned to Rider'}`);
    return tracking;
  }
}
