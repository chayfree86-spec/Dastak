<?php

namespace Tests\Feature;

use App\Enums\AccountStatus;
use App\Enums\UserRole;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ZoneManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_admin_can_create_and_list_zones(): void
    {
        $admin = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $admin->assignRole(UserRole::SUPER_ADMIN);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/zones', [
            'name' => 'Kanpur South Central',
            'city' => 'Kanpur',
            'center_latitude' => 26.4499,
            'center_longitude' => 80.3319,
            'radius_km' => 12.00,
            'is_active' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Kanpur South Central');

        $listResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/zones');

        $listResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }
}
