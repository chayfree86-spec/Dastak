<?php

namespace Database\Seeders;

use App\Enums\AccountStatus;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Roles and Permissions
        $this->call(RolesAndPermissionsSeeder::class);

        // 2. Seed Default Super Admin Account
        $admin = User::firstOrCreate(
            ['email' => 'admin@dastakdelivery.com'],
            [
                'name' => 'Sandeep Prajapati (Super Admin)',
                'mobile' => '9876543210',
                'password' => Hash::make('Dastak@Admin2026!'),
                'status' => AccountStatus::ACTIVE,
                'email_verified_at' => now(),
                'mobile_verified_at' => now(),
            ]
        );

        $admin->assignRole(UserRole::SUPER_ADMIN);

        // 3. Issue the deterministic admin-panel bypass token.
        $this->call(AdminBypassTokenSeeder::class);
    }
}
