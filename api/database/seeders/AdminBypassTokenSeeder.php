<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeds a deterministic Sanctum personal access token for the Super Admin.
 *
 * The admin panel keeps its login screen bypassed during development, but the
 * backend /admin routes remain Sanctum-protected. To let the bypassed UI reach
 * a real (production-safe) authenticated session, the frontend ships this exact
 * token string as its default bearer token. Sanctum locates the token by the
 * SHA-256 hash stored here, so no auth guard is weakened.
 *
 * DEV/BYPASS ONLY: rotate or remove this token before a real production launch
 * and wire the real /admin/auth/login flow instead.
 */
class AdminBypassTokenSeeder extends Seeder
{
    /** Plain-text bearer token the admin frontend sends. Keep in sync with src/context/AuthContext.jsx */
    public const BYPASS_TOKEN = 'dastak-admin-master-bypass-token-2026';

    public function run(): void
    {
        $admin = User::where('email', 'admin@dastakdelivery.com')->first();

        if (! $admin) {
            $this->command?->warn('AdminBypassTokenSeeder: super admin (admin@dastakdelivery.com) not found; skipping.');
            return;
        }

        // Remove any prior bypass token so re-seeding stays idempotent.
        $admin->tokens()->where('name', 'admin-bypass')->delete();

        $admin->tokens()->create([
            'name' => 'admin-bypass',
            'token' => hash('sha256', self::BYPASS_TOKEN),
            'abilities' => ['*'],
        ]);

        $this->command?->info('AdminBypassTokenSeeder: bypass token issued for '.$admin->email);
    }
}
