<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

/**
 * One-time fix: moves the admin panel off its dev-only login bypass onto real
 * credentials, and frees up the admin's mobile number from the test restaurant
 * owner account it had been reused on.
 */
class SecureAdminAccess extends Command
{
    protected $signature = 'dastak:secure-admin-access {--force : Skip confirmation}';

    protected $description = 'Set real admin credentials (mobile+PIN, email+password) and revoke the bypass token.';

    public function handle(): int
    {
        if (! $this->option('force') && ! $this->confirm('This will update the admin account credentials and revoke the bypass token. Continue?')) {
            $this->line('Aborted.');
            return self::SUCCESS;
        }

        $owner = User::where('mobile', '9628717175')
            ->where('email', '!=', 'admin@dastakdelivery.com')
            ->first();

        if ($owner) {
            $owner->update(['mobile' => '9005271986']);
            $this->info("Freed 9628717175 from {$owner->email} (now 9005271986).");
        } else {
            $this->line('No conflicting account holds 9628717175 — skipping that step.');
        }

        $admin = User::where('email', 'admin@dastakdelivery.com')->first();

        if (! $admin) {
            $this->error('admin@dastakdelivery.com not found — aborting.');
            return self::FAILURE;
        }

        $admin->update([
            'mobile' => '9628717175',
            'password' => Hash::make('Dastak#Secure2026!'),
            'login_pin' => Hash::make('2310'),
        ]);

        $revoked = $admin->tokens()->where('name', 'admin-bypass')->delete();

        $this->info("Admin credentials set — mobile: 9628717175, PIN: 2310, email: admin@dastakdelivery.com, password: Dastak#Secure2026!");
        $this->info("Bypass tokens revoked: {$revoked}");

        return self::SUCCESS;
    }
}
