<?php

namespace Tests\Feature;

use App\Enums\AccountStatus;
use App\Enums\AddressType;
use App\Enums\FoodType;
use App\Enums\OrderStatus;
use App\Enums\PaymentMode;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Address;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_customer_can_checkout_and_create_order_with_otp(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);

        $address = Address::create([
            'user_id' => $customer->id,
            'type' => AddressType::HOME,
            'contact_name' => $customer->name,
            'contact_mobile' => $customer->mobile,
            'address_line1' => 'Flat 201, Shanti Heights',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'is_default' => true,
        ]);

        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Biryani Mahal',
            'phone' => '9876543210',
            'address_line1' => 'Civil Lines',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'commission_rate' => 15.00,
            'is_open' => true,
            'is_active' => true,
        ]);

        $cat = MenuCategory::create(['restaurant_id' => $restaurant->id, 'name' => 'Biryani']);
        $item = MenuItem::create([
            'restaurant_id' => $restaurant->id,
            'category_id' => $cat->id,
            'name' => 'Chicken Dum Biryani',
            'base_price' => 250.00,
            'food_type' => FoodType::NON_VEG,
            'is_available' => true,
        ]);

        // 1. Add item to cart
        $this->actingAs($customer, 'sanctum')->postJson('/api/v1/customer/cart/items', [
            'restaurant_id' => $restaurant->id,
            'menu_item_id' => $item->id,
            'quantity' => 2, // 500
        ]);

        // 2. Checkout
        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/v1/customer/orders/checkout', [
            'delivery_address_id' => $address->id,
            'payment_mode' => PaymentMode::COD->value,
            'special_instructions' => 'Ring bell twice',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', OrderStatus::PENDING->value)
            ->assertJsonPath('data.bill.subtotal', 500)
            ->assertJsonStructure(['data' => ['id', 'order_number', 'delivery_otp', 'timelines']]);

        // 3. Verify Cart is cleared
        $cartResponse = $this->actingAs($customer, 'sanctum')->getJson('/api/v1/customer/cart');
        $cartResponse->assertStatus(200)
            ->assertJsonPath('data.items_count', 0);
    }

    public function test_complete_order_lifecycle_and_otp_delivery_verification(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $ownerRole = Role::where('slug', UserRole::RESTAURANT->value)->first();
        $owner->roles()->attach($ownerRole);

        $rider = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $riderRole = Role::where('slug', UserRole::DELIVERY_BOY->value)->first();
        $rider->roles()->attach($riderRole);
        $rider->deliveryProfile()->create([
            'is_online' => true,
            'is_busy' => false,
            'current_latitude' => 26.4499,
            'current_longitude' => 80.3319,
        ]);

        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Punjab Kitchen',
            'phone' => '9876543210',
            'address_line1' => 'Mall Road',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'is_open' => true,
            'is_active' => true,
        ]);

        $cat = MenuCategory::create(['restaurant_id' => $restaurant->id, 'name' => 'Curries']);
        $item = MenuItem::create([
            'restaurant_id' => $restaurant->id,
            'category_id' => $cat->id,
            'name' => 'Paneer Butter Masala',
            'base_price' => 200.00,
            'food_type' => FoodType::VEG,
            'is_available' => true,
        ]);

        $order = Order::create([
            'order_number' => 'DSTK-2026-TEST1',
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'delivery_boy_id' => $rider->id,
            'status' => OrderStatus::PENDING,
            'payment_status' => PaymentStatus::PENDING,
            'payment_mode' => PaymentMode::COD,
            'subtotal' => 200.00,
            'delivery_fee' => 35.00,
            'tax_amount' => 10.00,
            'total_amount' => 245.00,
            'commission_rate' => 15.00,
            'commission_amount' => 30.00,
            'restaurant_payout_amount' => 180.00,
            'delivery_address_json' => ['address_line1' => 'Civil Lines'],
            'delivery_otp' => '4567',
            'placed_at' => now(),
        ]);

        // 1. Partner Accepts -> CONFIRMED
        $acceptResponse = $this->actingAs($owner, 'sanctum')->patchJson("/api/v1/partner/orders/{$order->order_number}/accept");
        $acceptResponse->assertStatus(200)->assertJsonPath('data.status', OrderStatus::CONFIRMED->value);

        // 2. Partner Marks Preparing -> PREPARING
        $prepResponse = $this->actingAs($owner, 'sanctum')->patchJson("/api/v1/partner/orders/{$order->order_number}/preparing");
        $prepResponse->assertStatus(200)->assertJsonPath('data.status', OrderStatus::PREPARING->value);

        // 3. Partner Marks Ready -> READY_FOR_PICKUP
        $readyResponse = $this->actingAs($owner, 'sanctum')->patchJson("/api/v1/partner/orders/{$order->order_number}/ready");
        $readyResponse->assertStatus(200)->assertJsonPath('data.status', OrderStatus::READY_FOR_PICKUP->value);

        // 4. Rider Picks Up -> OUT_FOR_DELIVERY
        $pickupResponse = $this->actingAs($rider, 'sanctum')->patchJson("/api/v1/delivery/orders/{$order->order_number}/pickup");
        $pickupResponse->assertStatus(200)->assertJsonPath('data.status', OrderStatus::OUT_FOR_DELIVERY->value);

        // 5. Wrong OTP Verification -> 422 Error
        $wrongOtpResponse = $this->actingAs($rider, 'sanctum')->postJson("/api/v1/delivery/orders/{$order->order_number}/verify-delivery", [
            'otp' => '0000',
        ]);
        $wrongOtpResponse->assertStatus(422);

        // 6. Correct OTP Verification -> DELIVERED & Paid
        $deliverResponse = $this->actingAs($rider, 'sanctum')->postJson("/api/v1/delivery/orders/{$order->order_number}/verify-delivery", [
            'otp' => '4567',
        ]);
        $deliverResponse->assertStatus(200)
            ->assertJsonPath('data.status', OrderStatus::DELIVERED->value)
            ->assertJsonPath('data.payment_status', PaymentStatus::PAID->value);

        // Check COD ledger updated on rider profile
        $this->assertEquals(245.00, (float) $rider->deliveryProfile->fresh()->pending_cod_amount);
    }

    public function test_customer_can_cancel_order_within_grace_window(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);

        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Dosa Corner',
            'phone' => '9876543210',
            'address_line1' => 'Kakadeo',
            'city' => 'Kanpur',
            'pincode' => '208025',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'is_open' => true,
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number' => 'DSTK-2026-CANCEL1',
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'status' => OrderStatus::PENDING,
            'payment_status' => PaymentStatus::PENDING,
            'payment_mode' => PaymentMode::COD,
            'subtotal' => 150.00,
            'total_amount' => 185.00,
            'delivery_address_json' => ['address_line1' => 'Kakadeo'],
            'delivery_otp' => '1234',
            'placed_at' => now(),
        ]);

        $response = $this->actingAs($customer, 'sanctum')->postJson("/api/v1/customer/orders/{$order->order_number}/cancel", [
            'reason' => 'Changed my mind',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', OrderStatus::CANCELLED->value)
            ->assertJsonPath('data.cancelled_by', 'CUSTOMER');
    }
}
