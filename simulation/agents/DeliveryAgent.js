import { DastakApiClient } from '../api.js';

export class DeliveryAgent {
  constructor(credentials = { identifier: 'rahul.rider@dastakdelivery.com', password: 'password123' }) {
    this.name = 'Delivery Rider Agent (Rahul Verma)';
    this.credentials = credentials;
    this.api = new DastakApiClient();
    this.user = null;
  }

  log(msg) {
    console.log(`\x1b[35m[DELIVERY RIDER AGENT]\x1b[0m ${msg}`);
  }

  async init() {
    this.log(`Authenticating rider as ${this.credentials.identifier}...`);
    const res = await this.api.login(this.credentials.identifier, this.credentials.password);
    this.user = res.data?.user;
    this.log(`Rider authenticated! Name: ${this.user?.name}`);

    // Set online status
    this.log('Going ONLINE and ready for dispatch assignment...');
    await this.api.setRiderDutyStatus(true);
    this.log('Rider duty status is now \x1b[32mONLINE (Available)\x1b[0m.');
    return this.user;
  }

  async pickupOrder(orderNumber) {
    this.log(`Rider arrived at restaurant. Picking up order \x1b[32m${orderNumber}\x1b[0m...`);
    const res = await this.api.pickupRiderOrder(orderNumber);
    this.log(`Order ${orderNumber} picked up! Status is now \x1b[36mOUT FOR DELIVERY\x1b[0m.`);
    return res.data;
  }

  async simulateTransitGPS(startLat = 26.4520, startLng = 80.3340, endLat = 26.4490, endLng = 80.3310, steps = 3) {
    this.log(`Streaming live GPS coordinates towards customer location...`);
    for (let i = 1; i <= steps; i++) {
      const curLat = startLat + ((endLat - startLat) * (i / steps));
      const curLng = startLng + ((endLng - startLng) * (i / steps));
      await this.api.updateRiderLocation(curLat, curLng);
      this.log(`[GPS Step ${i}/${steps}] Current Coordinates: (${curLat.toFixed(4)}, ${curLng.toFixed(4)}) - Speed: 28 km/h`);
      await new Promise(r => setTimeout(r, 600));
    }
    this.log('Rider reached customer doorstep!');
  }

  async completeDelivery(orderNumber, otp) {
    this.log(`Asking customer for OTP and verifying delivery (\x1b[33mOTP: ${otp}\x1b[0m)...`);
    const res = await this.api.verifyRiderDelivery(orderNumber, otp);
    this.log(`Delivery verified! Order ${orderNumber} marked \x1b[32mDELIVERED\x1b[0m successfully!`);
    return res.data;
  }
}
