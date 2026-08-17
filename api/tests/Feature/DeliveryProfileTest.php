<?php

namespace Tests\Feature;

use App\Enums\AccountStatus;
use App\Enums\UserRole;
use App\Enums\VehicleType;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeliveryProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_rider_can_toggle_duty_status(): void
    {
        $rider = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $rider->assignRole(UserRole::DELIVERY_BOY);

        // Turn Online
        $response = $this->actingAs($rider, 'sanctum')->patchJson('/api/v1/delivery/duty-status', [
            'is_online' => true,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_online', true);

        // Turn Offline
        $responseOffline = $this->actingAs($rider, 'sanctum')->patchJson('/api/v1/delivery/duty-status', [
            'is_online' => false,
        ]);

        $responseOffline->assertStatus(200)
            ->assertJsonPath('data.is_online', false);
    }

    public function test_rider_can_update_gps_location(): void
    {
        $rider = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $rider->assignRole(UserRole::DELIVERY_BOY);

        $response = $this->actingAs($rider, 'sanctum')->postJson('/api/v1/delivery/location', [
            'latitude' => 26.4520,
            'longitude' => 80.3350,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.current_latitude', 26.452)
            ->assertJsonPath('data.current_longitude', 80.335);
    }

    public function test_rider_can_update_vehicle_and_bank_info(): void
    {
        $rider = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $rider->assignRole(UserRole::DELIVERY_BOY);

        $response = $this->actingAs($rider, 'sanctum')->putJson('/api/v1/delivery/profile', [
            'vehicle_type' => VehicleType::EV_SCOOTER->value,
            'vehicle_number' => 'UP-78-EV-1001',
            'driving_license_number' => 'DL-UP78-20240099',
            'bank_account_name' => 'Amit Kumar',
            'bank_account_number' => '123456789012',
            'bank_ifsc' => 'SBIN0001234',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.vehicle_type', 'EV_SCOOTER')
            ->assertJsonPath('data.bank_account_name', 'Amit Kumar');
    }
}
