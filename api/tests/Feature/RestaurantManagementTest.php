<?php

namespace Tests\Feature;

use App\Enums\AccountStatus;
use App\Enums\UserRole;
use App\Models\Restaurant;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RestaurantManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_public_can_list_nearby_restaurants_with_calculated_distance(): void
    {
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $owner->assignRole(UserRole::RESTAURANT);

        // Near restaurant (Kanpur Civil Lines: ~2.5 KM)
        $near = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Royal Biryani House',
            'phone' => '9876543210',
            'address_line1' => 'Civil Lines',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4600,
            'longitude' => 80.3400,
            'is_pure_veg' => false,
            'is_open' => true,
            'is_active' => true,
        ]);

        // Far restaurant (> 50 KM)
        Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Lucknow Flavors',
            'phone' => '9876543211',
            'address_line1' => 'Hazratganj',
            'city' => 'Lucknow',
            'pincode' => '226001',
            'latitude' => 26.8467,
            'longitude' => 80.9462,
            'is_pure_veg' => false,
            'is_open' => true,
            'is_active' => true,
        ]);

        // Search near 26.4499, 80.3319 with radius 12 KM
        $response = $this->getJson('/api/v1/restaurants?latitude=26.4499&longitude=80.3319&radius_km=12');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.name', 'Royal Biryani House');
    }

    public function test_public_can_filter_pure_veg_restaurants(): void
    {
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $owner->assignRole(UserRole::RESTAURANT);

        Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Shuddh Shakahari Bhojnalaya',
            'phone' => '9876543210',
            'address_line1' => 'Govind Nagar',
            'city' => 'Kanpur',
            'pincode' => '208006',
            'latitude' => 26.4400,
            'longitude' => 80.3200,
            'is_pure_veg' => true,
            'is_open' => true,
            'is_active' => true,
        ]);

        Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Chicken Corner',
            'phone' => '9876543211',
            'address_line1' => 'Mall Road',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4500,
            'longitude' => 80.3300,
            'is_pure_veg' => false,
            'is_open' => true,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/restaurants?is_pure_veg=1');

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.name', 'Shuddh Shakahari Bhojnalaya');
    }

    public function test_restaurant_partner_can_toggle_open_status(): void
    {
        $partner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $partner->assignRole(UserRole::RESTAURANT);

        $restaurant = Restaurant::create([
            'owner_id' => $partner->id,
            'name' => 'Pizza Junction',
            'phone' => '9876543210',
            'address_line1' => 'Kakadeo',
            'city' => 'Kanpur',
            'pincode' => '208025',
            'latitude' => 26.4700,
            'longitude' => 80.3000,
            'is_open' => true,
            'is_active' => true,
        ]);

        $response = $this->actingAs($partner, 'sanctum')->patchJson('/api/v1/partner/restaurant/toggle-open', [
            'is_open' => false,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_open', false);

        $this->assertFalse((bool) $restaurant->fresh()->is_open);
    }

    public function test_admin_can_onboard_and_suspend_restaurant(): void
    {
        $admin = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $admin->assignRole(UserRole::SUPER_ADMIN);

        $partner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $partner->assignRole(UserRole::RESTAURANT);

        // Onboard
        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/restaurants', [
            'owner_id' => $partner->id,
            'name' => 'Mithas Sweets',
            'phone' => '9876543210',
            'address_line1' => 'Swaroop Nagar',
            'city' => 'Kanpur',
            'pincode' => '208002',
            'latitude' => 26.4800,
            'longitude' => 80.3100,
            'commission_rate' => 12.50,
            'is_pure_veg' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Mithas Sweets');

        $restaurantId = $response->json('data.id');

        // Suspend
        $suspendResponse = $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/admin/restaurants/{$restaurantId}/status", [
            'is_active' => false,
        ]);

        $suspendResponse->assertStatus(200)
            ->assertJsonPath('data.is_active', false);
    }
}
