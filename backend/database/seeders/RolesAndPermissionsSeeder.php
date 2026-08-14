<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Define Core Permissions by Module
        $permissions = [
            // Dashboard
            ['name' => 'View Dashboard', 'slug' => 'dashboard.view', 'module' => 'dashboard', 'description' => 'Access operational dashboard and real-time KPIs'],

            // Orders
            ['name' => 'View Orders', 'slug' => 'orders.view', 'module' => 'orders', 'description' => 'View all platform orders and tracking details'],
            ['name' => 'Manage Orders', 'slug' => 'orders.manage', 'module' => 'orders', 'description' => 'Accept, update status, cancel or reassign orders'],

            // Restaurants
            ['name' => 'View Restaurants', 'slug' => 'restaurants.view', 'module' => 'restaurants', 'description' => 'View restaurant directories and menus'],
            ['name' => 'Manage Restaurants', 'slug' => 'restaurants.manage', 'module' => 'restaurants', 'description' => 'Approve, reject, suspend or edit restaurants'],

            // Delivery Boys
            ['name' => 'View Delivery Fleet', 'slug' => 'delivery.view', 'module' => 'delivery', 'description' => 'View delivery riders, live status and locations'],
            ['name' => 'Manage Delivery Fleet', 'slug' => 'delivery.manage', 'module' => 'delivery', 'description' => 'Onboard, assign deliveries or block riders'],

            // Customers
            ['name' => 'View Customers', 'slug' => 'customers.view', 'module' => 'customers', 'description' => 'View customer profiles and order histories'],
            ['name' => 'Manage Customers', 'slug' => 'customers.manage', 'module' => 'customers', 'description' => 'Block or unblock customer accounts'],

            // Finance & Settlements
            ['name' => 'View Finance', 'slug' => 'finance.view', 'module' => 'finance', 'description' => 'View revenue, commissions, COD and earnings'],
            ['name' => 'Manage Settlements', 'slug' => 'finance.settlements', 'module' => 'finance', 'description' => 'Process partner payouts and commission rates'],

            // Marketing & Coupons
            ['name' => 'Manage Marketing', 'slug' => 'marketing.manage', 'module' => 'marketing', 'description' => 'Create and edit promotional coupons and banners'],

            // Reports & Analytics
            ['name' => 'View Reports', 'slug' => 'reports.view', 'module' => 'reports', 'description' => 'Generate and export CSV/Excel accounting reports'],

            // Support & Tickets
            ['name' => 'Manage Support', 'slug' => 'support.manage', 'module' => 'support', 'description' => 'Reply to and resolve customer and partner grievances'],

            // Settings & Geofences
            ['name' => 'Manage Platform Settings', 'slug' => 'settings.manage', 'module' => 'settings', 'description' => 'Configure platform parameters, fees and zones'],
        ];

        foreach ($permissions as $permData) {
            Permission::firstOrCreate(['slug' => $permData['slug']], $permData);
        }

        // 2. Define System Roles
        $roles = [
            UserRole::SUPER_ADMIN->value => [
                'name' => UserRole::SUPER_ADMIN->label(),
                'description' => 'Unrestricted access across all platform modules and settings.',
                'permissions' => Permission::all()->pluck('slug')->toArray(),
            ],
            UserRole::OPERATIONS_ADMIN->value => [
                'name' => UserRole::OPERATIONS_ADMIN->label(),
                'description' => 'Manage daily operations: Orders, Restaurants, Delivery Fleet and Support.',
                'permissions' => [
                    'dashboard.view', 'orders.view', 'orders.manage',
                    'restaurants.view', 'restaurants.manage',
                    'delivery.view', 'delivery.manage',
                    'customers.view', 'support.manage',
                ],
            ],
            UserRole::FINANCE_ADMIN->value => [
                'name' => UserRole::FINANCE_ADMIN->label(),
                'description' => 'Manage platform finances, commissions, settlements and reports.',
                'permissions' => [
                    'dashboard.view', 'finance.view', 'finance.settlements',
                    'reports.view', 'orders.view',
                ],
            ],
            UserRole::SUPPORT_ADMIN->value => [
                'name' => UserRole::SUPPORT_ADMIN->label(),
                'description' => 'Handle customer inquiries, order issues and support tickets.',
                'permissions' => [
                    'dashboard.view', 'orders.view', 'customers.view',
                    'support.manage',
                ],
            ],
            UserRole::RESTAURANT->value => [
                'name' => UserRole::RESTAURANT->label(),
                'description' => 'Manage owned restaurant, menu items, incoming orders and earnings.',
                'permissions' => [],
            ],
            UserRole::DELIVERY_BOY->value => [
                'name' => UserRole::DELIVERY_BOY->label(),
                'description' => 'Handle assigned order deliveries and COD collections.',
                'permissions' => [],
            ],
            UserRole::CUSTOMER->value => [
                'name' => UserRole::CUSTOMER->label(),
                'description' => 'Browse restaurants, place orders and track deliveries.',
                'permissions' => [],
            ],
        ];

        foreach ($roles as $slug => $roleData) {
            $role = Role::firstOrCreate(
                ['slug' => $slug],
                [
                    'name' => $roleData['name'],
                    'description' => $roleData['description'],
                    'is_system' => true,
                ]
            );

            if (! empty($roleData['permissions'])) {
                $permIds = Permission::whereIn('slug', $roleData['permissions'])->pluck('id');
                $role->permissions()->sync($permIds);
            }
        }
    }
}
