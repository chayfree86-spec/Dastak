<?php

namespace Tests\Feature;

use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentMode;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Events\NewDeliveryTaskBroadcast;
use App\Events\NewOrderReceivedBroadcast;
use App\Events\OrderStatusUpdatedBroadcast;
use App\Events\RiderLocationUpdatedBroadcast;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\RiderLocation;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RealtimeBroadcastAndTelemetryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_rider_can_stream_gps_telemetry_and_update_live_coordinates(): void
    {
        $rider = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $riderRole = Role::where('slug', UserRole::DELIVERY_BOY->value)->first();
        $rider->roles()->attach($riderRole);
        $profile = $rider->deliveryProfile()->create([
            'is_online' => true,
            'current_latitude' => 26.4499,
            'current_longitude' => 80.3319,
        ]);

        $response = $this->actingAs($rider, 'sanctum')->postJson('/api/v1/delivery/location/stream', [
            'latitude' => 26.4520000,
            'longitude' => 80.3350000,
            'heading' => 90.5,
            'speed' => 32.4,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.latitude', 26.452)
            ->assertJsonPath('data.longitude', 80.335);

        // Assert profile updated
        $this->assertEquals(26.452, (float) $profile->fresh()->current_latitude);
        $this->assertEquals(80.335, (float) $profile->fresh()->current_longitude);

        // Assert rider_locations table recorded
        $this->assertDatabaseHas('rider_locations', [
            'user_id' => $rider->id,
            'latitude' => 26.4520000,
            'longitude' => 80.3350000,
        ]);
    }

    public function test_customer_can_get_live_order_tracking_data(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);

        $rider = User::factory()->create(['status' => AccountStatus::ACTIVE, 'name' => 'Rahul Rider', 'mobile' => '9988776655']);
        $riderRole = Role::where('slug', UserRole::DELIVERY_BOY->value)->first();
        $rider->roles()->attach($riderRole);
        $rider->deliveryProfile()->create([
            'is_online' => true,
            'is_busy' => true,
            'vehicle_type' => 'MOTORCYCLE',
            'vehicle_number' => 'UP78-AB-1234',
            'current_latitude' => 26.4510000,
            'current_longitude' => 80.3320000,
        ]);

        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Biryani Junction',
            'phone' => '9876543210',
            'address_line1' => 'Mall Road',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4600000,
            'longitude' => 80.3400000,
            'is_open' => true,
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number' => 'DSTK-2026-GPS1',
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'delivery_boy_id' => $rider->id,
            'status' => OrderStatus::OUT_FOR_DELIVERY,
            'payment_status' => PaymentStatus::PAID,
            'payment_mode' => PaymentMode::ONLINE,
            'subtotal' => 350.00,
            'total_amount' => 385.00,
            'delivery_address_json' => [
                'contact_name' => 'Vikas',
                'address_line1' => 'Civil Lines, Kanpur',
                'latitude' => 26.4500000,
                'longitude' => 80.3300000,
            ],
            'delivery_otp' => '5678',
            'placed_at' => now(),
        ]);

        $response = $this->actingAs($customer, 'sanctum')->getJson("/api/v1/customer/orders/{$order->order_number}/live-tracking");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.order.order_number', 'DSTK-2026-GPS1')
            ->assertJsonPath('data.order.delivery_otp', '5678')
            ->assertJsonPath('data.restaurant.name', 'Biryani Junction')
            ->assertJsonPath('data.restaurant.latitude', 26.46)
            ->assertJsonPath('data.customer_destination.latitude', 26.45)
            ->assertJsonPath('data.rider.name', 'Rahul Rider')
            ->assertJsonPath('data.rider.current_latitude', 26.451);
    }

    public function test_admin_can_view_live_fleet_telemetry_map(): void
    {
        $admin = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $adminRole = Role::where('slug', UserRole::SUPER_ADMIN->value)->first();
        $admin->roles()->attach($adminRole);

        $rider = User::factory()->create(['status' => AccountStatus::ACTIVE, 'name' => 'Amit Sharma']);
        $riderRole = Role::where('slug', UserRole::DELIVERY_BOY->value)->first();
        $rider->roles()->attach($riderRole);
        $rider->deliveryProfile()->create([
            'is_online' => true,
            'is_busy' => false,
            'current_latitude' => 26.4550000,
            'current_longitude' => 80.3360000,
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/fleet/live-map');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.name', 'Amit Sharma')
            ->assertJsonPath('data.0.is_online', true)
            ->assertJsonPath('data.0.latitude', 26.455);
    }

    public function test_broadcast_event_payloads_and_channel_names(): void
    {
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Royal Diner',
            'phone' => '9876543210',
            'address_line1' => 'Mall Road',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4600000,
            'longitude' => 80.3400000,
            'is_open' => true,
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number' => 'DSTK-2026-EVENT1',
            'customer_id' => $owner->id,
            'restaurant_id' => $restaurant->id,
            'status' => OrderStatus::PREPARING,
            'payment_status' => PaymentStatus::PAID,
            'payment_mode' => PaymentMode::ONLINE,
            'subtotal' => 200.00,
            'total_amount' => 235.00,
            'delivery_address_json' => ['address_line1' => 'Mall Road'],
            'delivery_otp' => '4321',
            'placed_at' => now(),
        ]);

        // 1. Order Status Broadcast
        $statusEvent = new OrderStatusUpdatedBroadcast($order, OrderStatus::CONFIRMED, OrderStatus::PREPARING);
        $channels = $statusEvent->broadcastOn();
        $this->assertEquals("private-order.{$order->order_number}", $channels[0]->name);
        $this->assertEquals('order.status.updated', $statusEvent->broadcastAs());

        // 2. Kitchen Broadcast
        $kitchenEvent = new NewOrderReceivedBroadcast($order);
        $kitchenChannels = $kitchenEvent->broadcastOn();
        $this->assertEquals("private-restaurant.{$restaurant->id}", $kitchenChannels[0]->name);
        $this->assertEquals('restaurant.new.order', $kitchenEvent->broadcastAs());

        // 3. Location Broadcast
        $location = RiderLocation::create([
            'user_id' => $owner->id,
            'latitude' => 26.4500000,
            'longitude' => 80.3300000,
            'recorded_at' => now(),
        ]);
        $locEvent = new RiderLocationUpdatedBroadcast($location, $order->order_number);
        $locChannels = $locEvent->broadcastOn();
        $this->assertEquals("private-rider-telemetry.{$owner->id}", $locChannels[0]->name);
        $this->assertEquals("private-order.{$order->order_number}", $locChannels[2]->name);

        // 4. Rider Task Broadcast
        $taskEvent = new NewDeliveryTaskBroadcast($order, 99);
        $taskChannels = $taskEvent->broadcastOn();
        $this->assertEquals('private-rider.99', $taskChannels[0]->name);
        $this->assertEquals('rider.new.task', $taskEvent->broadcastAs());
    }
}
