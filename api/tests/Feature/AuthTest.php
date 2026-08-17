<?php

namespace Tests\Feature;

use App\Enums\AccountStatus;
use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_user_can_login_with_email(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@dastakdelivery.com',
            'mobile' => '9876543210',
            'password' => Hash::make('Secret123!'),
            'status' => AccountStatus::ACTIVE,
        ]);
        $user->assignRole(UserRole::SUPER_ADMIN);

        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'admin@dastakdelivery.com',
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'token',
                    'user' => ['id', 'name', 'email', 'mobile', 'status', 'role', 'permissions'],
                ],
            ]);
    }

    public function test_user_can_login_with_mobile_number(): void
    {
        $user = User::factory()->create([
            'email' => 'rider@dastakdelivery.com',
            'mobile' => '9811223344',
            'password' => Hash::make('Secret123!'),
            'status' => AccountStatus::ACTIVE,
        ]);
        $user->assignRole(UserRole::DELIVERY_BOY);

        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => '9811223344',
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'delivery_boy');
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'user@dastakdelivery.com',
            'password' => Hash::make('Secret123!'),
            'status' => AccountStatus::ACTIVE,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'user@dastakdelivery.com',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'The provided credentials do not match our records.');
    }

    public function test_blocked_user_cannot_login(): void
    {
        User::factory()->create([
            'email' => 'blocked@dastakdelivery.com',
            'password' => Hash::make('Secret123!'),
            'status' => AccountStatus::BLOCKED,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'blocked@dastakdelivery.com',
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_fetch_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@dastakdelivery.com',
            'status' => AccountStatus::ACTIVE,
        ]);
        $user->assignRole(UserRole::SUPER_ADMIN);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', 'admin@dastakdelivery.com');
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create([
            'status' => AccountStatus::ACTIVE,
        ]);
        $token = $user->createToken('Test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }
}
