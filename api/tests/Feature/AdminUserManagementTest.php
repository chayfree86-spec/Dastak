<?php

namespace Tests\Feature;

use App\Enums\AccountStatus;
use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_admin_can_list_users_with_filters(): void
    {
        $admin = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $admin->assignRole(UserRole::SUPER_ADMIN);

        // Create 3 customers and 2 delivery boys
        User::factory()->count(3)->create(['status' => AccountStatus::ACTIVE])->each(fn ($u) => $u->assignRole(UserRole::CUSTOMER));
        User::factory()->count(2)->create(['status' => AccountStatus::ACTIVE])->each(fn ($u) => $u->assignRole(UserRole::DELIVERY_BOY));

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/users?role=customer');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('meta.total', 3);
    }

    public function test_admin_can_block_and_unblock_user(): void
    {
        $admin = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $admin->assignRole(UserRole::SUPER_ADMIN);

        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $token = $customer->createToken('CustToken')->plainTextToken;

        // Admin blocks user
        $response = $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/admin/users/{$customer->id}/status", [
            'status' => AccountStatus::BLOCKED->value,
            'reason' => 'Fraudulent COD cancellations detected',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'BLOCKED');

        // Reset auth state for customer request
        app('auth')->forgetGuards();

        // Customer's existing token is now revoked and rejected
        $custResponse = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/customer/profile');

        $custResponse->assertStatus(401);
    }

    public function test_non_admin_cannot_access_admin_user_directory(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $customer->assignRole(UserRole::CUSTOMER);

        $response = $this->actingAs($customer, 'sanctum')->getJson('/api/v1/admin/users');

        $response->assertStatus(403);
    }
}
