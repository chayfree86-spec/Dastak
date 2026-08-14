<?php

namespace Tests\Feature;

use App\Enums\AccountStatus;
use App\Enums\CodStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentMode;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Enums\UserRole;
use App\Models\CodCollection;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Restaurant;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentAndRefundTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_customer_can_initiate_online_payment_and_verify_signature(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);

        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Royal Spice',
            'phone' => '9876543210',
            'address_line1' => 'Mall Road',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'is_open' => true,
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number' => 'DSTK-2026-PAY1',
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'status' => OrderStatus::PENDING,
            'payment_status' => PaymentStatus::PENDING,
            'payment_mode' => PaymentMode::ONLINE,
            'subtotal' => 450.00,
            'delivery_fee' => 35.00,
            'tax_amount' => 22.50,
            'total_amount' => 507.50,
            'delivery_address_json' => ['address_line1' => 'Civil Lines'],
            'delivery_otp' => '1234',
            'placed_at' => now(),
        ]);

        // 1. Initiate Payment
        $initResponse = $this->actingAs($customer, 'sanctum')->postJson('/api/v1/customer/payments/initiate', [
            'order_number' => $order->order_number,
        ]);

        $initResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['payment_id', 'gateway_order_id', 'amount', 'currency']]);

        $gatewayOrderId = $initResponse->json('data.gateway_order_id');
        $razorpayPaymentId = 'pay_test_99999';
        $mockSignature = 'mock_valid_signature_' . $razorpayPaymentId;

        // 2. Verify Payment
        $verifyResponse = $this->actingAs($customer, 'sanctum')->postJson('/api/v1/customer/payments/verify', [
            'order_number' => $order->order_number,
            'gateway_payment_id' => $razorpayPaymentId,
            'gateway_signature' => $mockSignature,
        ]);

        $verifyResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'SUCCESS')
            ->assertJsonPath('data.amount', 507.5);

        // Assert order is marked PAID
        $this->assertEquals(PaymentStatus::PAID, $order->fresh()->payment_status);
    }

    public function test_invalid_signature_fails_payment_verification(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);

        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Pizza World',
            'phone' => '9876543210',
            'address_line1' => 'Mall Road',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'is_open' => true,
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number' => 'DSTK-2026-PAY2',
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'status' => OrderStatus::PENDING,
            'payment_status' => PaymentStatus::PENDING,
            'payment_mode' => PaymentMode::ONLINE,
            'subtotal' => 200.00,
            'total_amount' => 235.00,
            'delivery_address_json' => ['address_line1' => 'Civil Lines'],
            'delivery_otp' => '1234',
            'placed_at' => now(),
        ]);

        $this->actingAs($customer, 'sanctum')->postJson('/api/v1/customer/payments/initiate', [
            'order_number' => $order->order_number,
        ]);

        $verifyResponse = $this->actingAs($customer, 'sanctum')->postJson('/api/v1/customer/payments/verify', [
            'order_number' => $order->order_number,
            'gateway_payment_id' => 'pay_fake_123',
            'gateway_signature' => 'invalid_random_signature',
        ]);

        $verifyResponse->assertStatus(422);
        $this->assertEquals(PaymentStatus::PENDING, $order->fresh()->payment_status);
    }

    public function test_finance_admin_can_process_refund(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        
        $admin = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $adminRole = Role::where('slug', UserRole::FINANCE_ADMIN->value)->first();
        $admin->roles()->attach($adminRole);

        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Chai Point',
            'phone' => '9876543210',
            'address_line1' => 'Civil Lines',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'is_open' => true,
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number' => 'DSTK-2026-REF1',
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'status' => OrderStatus::CANCELLED,
            'payment_status' => PaymentStatus::PAID,
            'payment_mode' => PaymentMode::ONLINE,
            'subtotal' => 300.00,
            'total_amount' => 335.00,
            'delivery_address_json' => ['address_line1' => 'Civil Lines'],
            'delivery_otp' => '1234',
            'placed_at' => now(),
        ]);

        Payment::create([
            'order_id' => $order->id,
            'user_id' => $customer->id,
            'transaction_id' => 'txn_123456789',
            'gateway_order_id' => 'rzp_order_test',
            'gateway_payment_id' => 'pay_test_succ',
            'amount' => 335.00,
            'status' => 'SUCCESS',
            'paid_at' => now(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/refunds/process', [
            'order_id' => $order->id,
            'reason' => 'Customer cancelled item before preparation',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', RefundStatus::PROCESSED->value)
            ->assertJsonPath('data.amount', 335);

        $this->assertEquals(PaymentStatus::REFUNDED, $order->fresh()->payment_status);
    }

    public function test_cod_flow_deposit_and_finance_admin_reconciliation(): void
    {
        $rider = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $riderRole = Role::where('slug', UserRole::DELIVERY_BOY->value)->first();
        $rider->roles()->attach($riderRole);
        $profile = $rider->deliveryProfile()->create([
            'is_online' => true,
            'pending_cod_amount' => 500.00,
        ]);

        $admin = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $adminRole = Role::where('slug', UserRole::FINANCE_ADMIN->value)->first();
        $admin->roles()->attach($adminRole);

        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Samosa Hub',
            'phone' => '9876543210',
            'address_line1' => 'Mall Road',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'is_open' => true,
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number' => 'DSTK-2026-COD1',
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'delivery_boy_id' => $rider->id,
            'status' => OrderStatus::DELIVERED,
            'payment_status' => PaymentStatus::PAID,
            'payment_mode' => PaymentMode::COD,
            'subtotal' => 500.00,
            'total_amount' => 500.00,
            'delivery_address_json' => ['address_line1' => 'Civil Lines'],
            'delivery_otp' => '1234',
            'placed_at' => now(),
        ]);

        $collection = CodCollection::create([
            'order_id' => $order->id,
            'delivery_boy_id' => $rider->id,
            'amount' => 500.00,
            'status' => CodStatus::COLLECTED,
        ]);

        // 1. Rider submits deposit
        $depositResponse = $this->actingAs($rider, 'sanctum')->postJson('/api/v1/delivery/cod/deposit', [
            'collection_ids' => [$collection->id],
        ]);
        $depositResponse->assertStatus(200);
        $this->assertEquals(CodStatus::DEPOSITED_TO_OFFICE, $collection->fresh()->status);

        // 2. Finance Admin verifies deposit and clears ledger
        $verifyResponse = $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/admin/cod/verify-deposit/{$collection->id}");
        $verifyResponse->assertStatus(200)
            ->assertJsonPath('data.status', CodStatus::VERIFIED->value);

        // Rider pending COD amount should be 0
        $this->assertEquals(0.00, (float) $profile->fresh()->pending_cod_amount);
    }
}
