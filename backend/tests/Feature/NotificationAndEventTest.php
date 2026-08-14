<?php

namespace Tests\Feature;

use App\Enums\AccountStatus;
use App\Enums\DeviceType;
use App\Enums\OrderStatus;
use App\Enums\PaymentMode;
use App\Enums\UserRole;
use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Role;
use App\Models\SmsLog;
use App\Models\User;
use App\Services\OrderService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationAndEventTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_user_can_register_and_unregister_device_fcm_token(): void
    {
        $user = User::factory()->create(['status' => AccountStatus::ACTIVE]);

        // Register token
        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/auth/device-token', [
            'fcm_token' => 'fcm_token_sample_12345_android',
            'device_type' => DeviceType::ANDROID->value,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.device_type', DeviceType::ANDROID->value)
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('user_device_tokens', [
            'user_id' => $user->id,
            'fcm_token' => 'fcm_token_sample_12345_android',
        ]);

        // Unregister token
        $deleteResponse = $this->actingAs($user, 'sanctum')->deleteJson('/api/v1/auth/device-token', [
            'fcm_token' => 'fcm_token_sample_12345_android',
        ]);

        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('user_device_tokens', [
            'user_id' => $user->id,
            'fcm_token' => 'fcm_token_sample_12345_android',
        ]);
    }

    public function test_order_placement_triggers_in_app_notifications_and_sms_logs(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE, 'mobile' => '9876543210']);
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $ownerRole = Role::where('slug', UserRole::RESTAURANT->value)->first();
        $owner->roles()->attach($ownerRole);

        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Royal Kitchen',
            'phone' => '9876543210',
            'address_line1' => 'Civil Lines',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'is_open' => true,
            'is_active' => true,
        ]);

        $category = \App\Models\MenuCategory::create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Main Course',
            'is_active' => true,
        ]);

        $item = MenuItem::create([
            'restaurant_id' => $restaurant->id,
            'category_id' => $category->id,
            'name' => 'Paneer Butter Masala',
            'base_price' => 250.00,
            'is_available' => true,
        ]);

        $address = Address::create([
            'user_id' => $customer->id,
            'type' => 'HOME',
            'contact_name' => $customer->name,
            'contact_mobile' => $customer->mobile,
            'address_line1' => 'Civil Lines',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'is_default' => true,
        ]);

        $cart = Cart::create([
            'user_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'delivery_address_id' => $address->id,
            'subtotal' => 250.00,
            'delivery_fee' => 35.00,
            'tax_amount' => 12.50,
            'total_amount' => 297.50,
        ]);

        CartItem::create([
            'cart_id' => $cart->id,
            'menu_item_id' => $item->id,
            'quantity' => 1,
            'unit_price' => 250.00,
            'total_price' => 250.00,
        ]);

        // Place order via checkout endpoint
        $checkoutResponse = $this->actingAs($customer, 'sanctum')->postJson('/api/v1/customer/orders/checkout', [
            'payment_mode' => PaymentMode::COD->value,
        ]);

        $checkoutResponse->assertStatus(201);

        // 1. Assert Customer got in-app database notification
        $this->assertEquals(1, $customer->notifications()->count());
        $custNotif = $customer->notifications()->first();
        $this->assertEquals('ORDER_PLACED', $custNotif->data['type']);

        // 2. Assert Restaurant Owner got in-app database notification
        $this->assertEquals(1, $owner->notifications()->count());
        $ownerNotif = $owner->notifications()->first();
        $this->assertEquals('ORDER_PLACED', $ownerNotif->data['type']);

        // 3. Assert SMS was logged
        $this->assertDatabaseHas('sms_logs', [
            'user_id' => $customer->id,
            'recipient' => $customer->mobile,
            'template_name' => 'ORDER_PLACED_CUSTOMER',
        ]);
    }

    public function test_order_status_transitions_and_rider_assignment_triggers_alerts(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE, 'mobile' => '9988776655']);
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $ownerRole = Role::where('slug', UserRole::RESTAURANT->value)->first();
        $owner->roles()->attach($ownerRole);

        $rider = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $riderRole = Role::where('slug', UserRole::DELIVERY_BOY->value)->first();
        $rider->roles()->attach($riderRole);
        $rider->deliveryProfile()->create(['is_online' => true]);

        $admin = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $adminRole = Role::where('slug', UserRole::SUPER_ADMIN->value)->first();
        $admin->roles()->attach($adminRole);

        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Burger Station',
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
            'order_number' => 'DSTK-2026-NOTIF1',
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'status' => OrderStatus::PENDING,
            'payment_status' => \App\Enums\PaymentStatus::PENDING,
            'payment_mode' => PaymentMode::COD,
            'subtotal' => 200.00,
            'total_amount' => 235.00,
            'delivery_address_json' => ['address_line1' => 'Civil Lines'],
            'delivery_otp' => '9988',
            'placed_at' => now(),
        ]);

        // 1. Assign Rider via Admin
        $assignResponse = $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/admin/orders/{$order->id}/assign-rider", [
            'rider_id' => $rider->id,
        ]);
        $assignResponse->assertStatus(200);

        // Assert Rider received task notification
        $this->assertEquals(1, $rider->notifications()->count());
        $this->assertEquals('NEW_DELIVERY_TASK', $rider->notifications()->first()->data['type']);

        // 2. Transition Order to OUT_FOR_DELIVERY
        $orderService = app(OrderService::class);
        $orderService->transitionStatus(
            order: $order->fresh(),
            targetStatus: OrderStatus::OUT_FOR_DELIVERY,
            actor: $rider,
            actorType: \App\Enums\ActorType::DELIVERY_BOY
        );

        // Assert Customer received OUT_FOR_DELIVERY status notification and SMS with OTP
        $this->assertDatabaseHas('sms_logs', [
            'user_id' => $customer->id,
            'template_name' => 'OUT_FOR_DELIVERY_OTP',
        ]);
    }

    public function test_user_in_app_notifications_feed_and_read_state_management(): void
    {
        $user = User::factory()->create(['status' => AccountStatus::ACTIVE]);

        $restaurant = Restaurant::create([
            'owner_id' => $user->id,
            'name' => 'Test Restro',
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
            'order_number' => 'DSTK-2026-FEED1',
            'customer_id' => $user->id,
            'restaurant_id' => $restaurant->id,
            'status' => OrderStatus::DELIVERED,
            'payment_status' => \App\Enums\PaymentStatus::PAID,
            'payment_mode' => PaymentMode::ONLINE,
            'subtotal' => 200.00,
            'total_amount' => 235.00,
            'delivery_address_json' => ['address_line1' => 'Civil Lines'],
            'delivery_otp' => '1234',
            'placed_at' => now(),
        ]);

        // Send 2 notifications
        $user->notify(new \App\Notifications\OrderPlacedNotification($order, 'CUSTOMER'));
        $user->notify(new \App\Notifications\OrderStatusNotification($order, OrderStatus::CONFIRMED, OrderStatus::DELIVERED));

        // 1. Get notifications list
        $feedResponse = $this->actingAs($user, 'sanctum')->getJson('/api/v1/notifications');
        $feedResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.unread_count', 2);

        $notificationId = $feedResponse->json('data.notifications.0.id');

        // 2. Mark single notification read
        $markReadResponse = $this->actingAs($user, 'sanctum')->patchJson("/api/v1/notifications/{$notificationId}/read");
        $markReadResponse->assertStatus(200);

        $this->assertEquals(1, $user->fresh()->unreadNotifications()->count());

        // 3. Mark all read
        $markAllReadResponse = $this->actingAs($user, 'sanctum')->patchJson('/api/v1/notifications/read-all');
        $markAllReadResponse->assertStatus(200);

        $this->assertEquals(0, $user->fresh()->unreadNotifications()->count());
    }
}
