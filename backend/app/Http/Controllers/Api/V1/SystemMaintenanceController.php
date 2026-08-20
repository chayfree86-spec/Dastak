<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SystemMaintenanceController extends Controller
{
    /**
     * Secret key for executing remote maintenance tasks.
     * Can be customized via DASTAK_MAINTENANCE_SECRET in .env.
     */
    private function verifySecret(Request $request): bool
    {
        $expectedSecret = env('DASTAK_MAINTENANCE_SECRET', 'dastak-maintenance-secret-key-2026');
        $providedSecret = $request->query('secret') ?? $request->header('X-Maintenance-Secret');

        return $providedSecret && hash_equals($expectedSecret, (string) $providedSecret);
    }

    /**
     * Run database migrations directly from web request.
     * GET/POST /api/v1/system/run-migrations?secret=...
     */
    public function runMigrations(Request $request)
    {
        if (!$this->verifySecret($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Invalid or missing maintenance secret.',
            ], 403);
        }

        try {
            $exitCode = Artisan::call('migrate', ['--force' => true]);
            $output = Artisan::output();

            return response()->json([
                'success' => $exitCode === 0,
                'exit_code' => $exitCode,
                'message' => 'Database migration executed successfully.',
                'output' => trim($output),
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Migration failed with exception: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ], 500);
        }
    }

    /**
     * Clear & rebuild all Laravel configuration & route caches.
     * GET/POST /api/v1/system/optimize-cache?secret=...
     */
    public function optimizeCache(Request $request)
    {
        if (!$this->verifySecret($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Invalid or missing maintenance secret.',
            ], 403);
        }

        try {
            Artisan::call('config:cache');
            $configOutput = Artisan::output();

            Artisan::call('route:cache');
            $routeOutput = Artisan::output();

            Artisan::call('view:cache');
            $viewOutput = Artisan::output();

            return response()->json([
                'success' => true,
                'message' => 'Application caches optimized successfully.',
                'output' => [
                    'config' => trim($configOutput),
                    'route' => trim($routeOutput),
                    'view' => trim($viewOutput),
                ],
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Optimization failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Clean test and transactional database records while strictly preserving Admin login credentials.
     * GET/POST /api/v1/system/clean-database?secret=...
     */
    public function cleanDatabase(Request $request)
    {
        if (!$this->verifySecret($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Invalid or missing maintenance secret.',
            ], 403);
        }

        try {
            // Find Admin and Super Admin role IDs
            $adminRoleIds = DB::table('roles')
                ->whereIn('slug', ['super_admin', 'super-admin', 'admin'])
                ->pluck('id')
                ->toArray();

            // Find user IDs that have admin role attached in user_roles pivot
            $adminPivotUserIds = DB::table('user_roles')
                ->whereIn('role_id', $adminRoleIds)
                ->pluck('user_id')
                ->toArray();

            // Find all Admin users to preserve
            $preservedAdminUsers = DB::table('users')
                ->where(function ($query) use ($adminPivotUserIds) {
                    if (!empty($adminPivotUserIds)) {
                        $query->whereIn('id', $adminPivotUserIds);
                    }
                    $query->orWhere('email', 'like', 'admin%')
                          ->orWhere('email', 'like', '%superadmin%')
                          ->orWhere('mobile', '9888800000');
                })
                ->get(['id', 'name', 'email', 'mobile']);

            $preservedUserIds = $preservedAdminUsers->pluck('id')->toArray();

            if (empty($preservedUserIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Safety check aborted: No Admin users were identified to preserve!',
                ], 400);
            }

            DB::beginTransaction();

            $deletedSummary = [];

            // 1. Transactional and log tables to truncate/clear completely
            $tablesToClear = [
                'order_item_addons',
                'order_items',
                'order_status_histories',
                'orders',
                'cart_item_addons',
                'cart_items',
                'carts',
                'payments',
                'refunds',
                'settlement_orders',
                'restaurant_settlements',
                'cod_collections',
                'support_ticket_messages',
                'support_tickets',
                'reviews',
                'rider_locations',
                'push_notifications',
                'sms_logs',
                'system_logs',
                'audit_logs',
                'app_device_sessions',
                'app_verification_sessions',
            ];

            foreach ($tablesToClear as $table) {
                if (Schema::hasTable($table)) {
                    $count = DB::table($table)->count();
                    DB::table($table)->delete();
                    $deletedSummary[$table] = $count;
                }
            }

            // 2. Clear non-admin tokens & devices
            if (Schema::hasTable('personal_access_tokens')) {
                $deletedTokens = DB::table('personal_access_tokens')
                    ->whereNotIn('tokenable_id', $preservedUserIds)
                    ->delete();
                $deletedSummary['personal_access_tokens'] = $deletedTokens;
            }

            if (Schema::hasTable('user_device_tokens')) {
                $deletedDeviceTokens = DB::table('user_device_tokens')
                    ->whereNotIn('user_id', $preservedUserIds)
                    ->delete();
                $deletedSummary['user_device_tokens'] = $deletedDeviceTokens;
            }

            // 3. Clear non-admin customer profiles & addresses
            if (Schema::hasTable('customer_profiles')) {
                $deletedProfiles = DB::table('customer_profiles')
                    ->whereNotIn('user_id', $preservedUserIds)
                    ->delete();
                $deletedSummary['customer_profiles'] = $deletedProfiles;
            }

            if (Schema::hasTable('addresses')) {
                $deletedAddresses = DB::table('addresses')
                    ->whereNotIn('user_id', $preservedUserIds)
                    ->delete();
                $deletedSummary['addresses'] = $deletedAddresses;
            }

            // 4. Delete non-admin users
            if (Schema::hasTable('users')) {
                $deletedUsers = DB::table('users')
                    ->whereNotIn('id', $preservedUserIds)
                    ->delete();
                $deletedSummary['non_admin_users'] = $deletedUsers;
            }

            DB::commit();

            // Clear application caches
            Cache::flush();

            return response()->json([
                'success' => true,
                'message' => 'Database cleaned successfully! Admin credentials have been fully preserved.',
                'preserved_admin_users' => $preservedAdminUsers,
                'deleted_records_summary' => $deletedSummary,
                'timestamp' => now()->toIso8601String(),
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Database cleaning failed: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ], 500);
        }
    }

    /**
     * Simple health & database connectivity check.
     * GET /api/v1/system/health
     */
    public function health()
    {
        $dbConnected = false;
        $dbError = null;

        try {
            DB::connection()->getPdo();
            $dbConnected = true;
        } catch (\Throwable $e) {
            $dbError = $e->getMessage();
        }

        return response()->json([
            'status' => $dbConnected ? 'healthy' : 'degraded',
            'app_url' => config('app.url'),
            'database_connected' => $dbConnected,
            'database_error' => $dbError,
            'server_time' => now()->toIso8601String(),
        ]);
    }
}
