import { DastakApiClient } from '../api.js';

export class PartnerAgent {
  constructor(credentials = { identifier: 'biryani@dastakdelivery.com', password: 'password123' }) {
    this.name = 'Restaurant Partner Agent (Dastak Biryani Mahal)';
    this.credentials = credentials;
    this.api = new DastakApiClient();
    this.user = null;
  }

  log(msg) {
    console.log(`\x1b[33m[RESTAURANT AGENT]\x1b[0m ${msg}`);
  }

  async init() {
    this.log(`Authenticating as ${this.credentials.identifier}...`);
    const res = await this.api.login(this.credentials.identifier, this.credentials.password);
    this.user = res.data?.user;
    this.log(`Kitchen Manager authenticated! User: ${this.user?.name}`);
    return this.user;
  }

  async acceptAndPrepare(orderNumber, prepMinutes = 15) {
    this.log(`Kitchen detected incoming order: \x1b[32m${orderNumber}\x1b[0m`);
    
    // Accept
    this.log(`Accepting order with estimated prep time: ${prepMinutes} mins...`);
    await this.api.acceptPartnerOrder(orderNumber, prepMinutes);
    this.log(`Order ${orderNumber} \x1b[32mACCEPTED\x1b[0m by Kitchen.`);

    // Preparing
    this.log(`Moving order ${orderNumber} to \x1b[33mPREPARING\x1b[0m state...`);
    await this.api.markPartnerOrderPreparing(orderNumber);
    this.log(`Chefs are preparing the meal for order ${orderNumber}...`);
  }

  async markReady(orderNumber) {
    this.log(`Meal preparation complete! Marking order ${orderNumber} as \x1b[32mREADY FOR PICKUP\x1b[0m...`);
    const res = await this.api.markPartnerOrderReady(orderNumber);
    this.log(`Order ${orderNumber} is packed and waiting for delivery partner pickup!`);
    return res.data;
  }
}
