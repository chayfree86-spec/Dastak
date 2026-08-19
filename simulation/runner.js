import { CustomerAgent } from './agents/CustomerAgent.js';
import { PartnerAgent } from './agents/PartnerAgent.js';
import { DeliveryAgent } from './agents/DeliveryAgent.js';
import { AdminWatcher } from './agents/AdminWatcher.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function printBanner() {
  console.log('\n' + '='.repeat(75));
  console.log('   🚀  DASTAK MULTI-AGENT AUTONOMOUS SIMULATION & TEST ENGINE  🚀');
  console.log('   Connecting Admin, Customer, Restaurant & Delivery Boy in Real-Time');
  console.log('='.repeat(75) + '\n');
}

async function runSingleCycle(cycleNumber = 1) {
  console.log(`\n▶️  [CYCLE #${cycleNumber}] Starting End-to-End Order Workflow Simulation...\n`);
  const startTime = Date.now();

  // 1. Initialize Agents
  const admin = new AdminWatcher();
  const customer = new CustomerAgent();
  const partner = new PartnerAgent();
  const delivery = new DeliveryAgent();

  console.log('--- [Phase 1: Agent Authentication & Handshake] ---');
  await admin.init();
  await delivery.init();
  await partner.init();
  await customer.init();

  await sleep(800);

  // 2. Admin audits initial state
  console.log('\n--- [Phase 2: Platform Baseline Audit] ---');
  await admin.auditLiveOperations();

  await sleep(800);

  // 3. Customer places order
  console.log('\n--- [Phase 3: Customer Places Order] ---');
  const order = await customer.placeOrder();
  const orderNumber = order.order_number;
  const deliveryOtp = order.delivery_otp;
  const orderId = order.id;

  await sleep(1000);

  // 4. Admin Watcher monitors order creation & rider assignment
  console.log('\n--- [Phase 4: Admin Watcher & Dispatch Verification] ---');
  await admin.verifyOrderStatus(orderId, 'PENDING');
  if (delivery.user?.id) {
    await admin.ensureOrderDispatched(orderId, delivery.user.id);
  }

  await sleep(1000);

  // 5. Restaurant Partner accepts and prepares order
  console.log('\n--- [Phase 5: Restaurant Kitchen Prepares Meal] ---');
  await partner.acceptAndPrepare(orderNumber, 15);
  
  await sleep(1200);

  // 6. Customer tracking check
  console.log('\n--- [Phase 6: Customer Live Tracking Update] ---');
  await customer.checkTracking(orderNumber);

  await sleep(1000);

  // 7. Restaurant marks order Ready for Pickup
  console.log('\n--- [Phase 7: Kitchen Packing & Ready for Pickup] ---');
  await partner.markReady(orderNumber);

  await sleep(1000);

  // 8. Delivery Rider picks up order
  console.log('\n--- [Phase 8: Delivery Rider Pickup & Transit] ---');
  await delivery.pickupOrder(orderNumber);

  await sleep(800);

  // 9. Rider GPS Stream
  await delivery.simulateTransitGPS();

  await sleep(800);

  // 10. Delivery verification with Customer OTP
  console.log('\n--- [Phase 9: Doorstep Verification & Delivery] ---');
  await delivery.completeDelivery(orderNumber, deliveryOtp);

  await sleep(1000);

  // 11. Final Admin Audit
  console.log('\n--- [Phase 10: Final System Audit & Settlement Confirmation] ---');
  await admin.verifyOrderStatus(orderId, 'DELIVERED');
  await admin.auditLiveOperations();

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(75));
  console.log(`✅  CYCLE #${cycleNumber} COMPLETED SUCCESSFULLY IN ${totalDuration}s!`);
  console.log(`   Order Number : ${orderNumber}`);
  console.log(`   Customer     : ${customer.user?.name} (Verified)`);
  console.log(`   Restaurant   : Dastak Biryani Mahal (Accepted & Prepared)`);
  console.log(`   Delivery Boy : ${delivery.user?.name} (Picked up & Delivered)`);
  console.log(`   Admin Ops    : Monitored & Verified`);
  console.log('='.repeat(75) + '\n');
}

async function main() {
  printBanner();
  
  const args = process.argv.slice(2);
  let loops = 1;
  const loopIndex = args.indexOf('--loop');
  if (loopIndex !== -1 && args[loopIndex + 1]) {
    loops = parseInt(args[loopIndex + 1], 10) || 1;
  }

  for (let i = 1; i <= loops; i++) {
    try {
      await runSingleCycle(i);
      if (i < loops) {
        console.log(`Waiting 3 seconds before cycle #${i + 1}...\n`);
        await sleep(3000);
      }
    } catch (err) {
      console.error('\n❌ SIMULATION ERROR:', err.response?.data || err.message);
      console.error(err.stack);
      break;
    }
  }
}

main();
