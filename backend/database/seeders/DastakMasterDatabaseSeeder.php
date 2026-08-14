<?php

namespace Database\Seeders;

use App\Enums\AccountStatus;
use App\Enums\CouponType;
use App\Enums\FoodType;
use App\Enums\UserRole;
use App\Enums\VehicleType;
use App\Models\Address;
use App\Models\Coupon;
use App\Models\MenuItemAddon;
use App\Models\MenuItemAddonGroup;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\MenuItemVariant;
use App\Models\MenuItemVariantGroup;
use App\Models\Restaurant;
use App\Models\RestaurantOperatingHour;
use App\Models\Role;
use App\Models\Zone;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DastakMasterDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Roles & Permissions
        $this->call(RolesAndPermissionsSeeder::class);

        $superAdminRole = Role::where('slug', UserRole::SUPER_ADMIN->value)->first();
        $opsAdminRole = Role::where('slug', UserRole::OPERATIONS_ADMIN->value)->first();
        $financeAdminRole = Role::where('slug', UserRole::FINANCE_ADMIN->value)->first();
        $supportAdminRole = Role::where('slug', UserRole::SUPPORT_ADMIN->value)->first();
        $restaurantRole = Role::where('slug', UserRole::RESTAURANT->value)->first();
        $riderRole = Role::where('slug', UserRole::DELIVERY_BOY->value)->first();
        $customerRole = Role::where('slug', UserRole::CUSTOMER->value)->first();

        // 2. Administrative Team
        $admin = User::firstOrCreate(['email' => 'admin@dastakdelivery.com'], [
            'name' => 'Dastak Super Admin',
            'mobile' => '9000000001',
            'password' => Hash::make('password123'),
            'status' => AccountStatus::ACTIVE,
            'email_verified_at' => now(),
        ]);
        $admin->roles()->sync([$superAdminRole->id]);

        $ops = User::firstOrCreate(['email' => 'ops@dastakdelivery.com'], [
            'name' => 'Dastak Operations Lead',
            'mobile' => '9000000002',
            'password' => Hash::make('password123'),
            'status' => AccountStatus::ACTIVE,
            'email_verified_at' => now(),
        ]);
        $ops->roles()->sync([$opsAdminRole->id]);

        $finance = User::firstOrCreate(['email' => 'finance@dastakdelivery.com'], [
            'name' => 'Dastak Finance Controller',
            'mobile' => '9000000003',
            'password' => Hash::make('password123'),
            'status' => AccountStatus::ACTIVE,
            'email_verified_at' => now(),
        ]);
        $finance->roles()->sync([$financeAdminRole->id]);

        $support = User::firstOrCreate(['email' => 'support@dastakdelivery.com'], [
            'name' => 'Dastak Support Desk',
            'mobile' => '9000000004',
            'password' => Hash::make('password123'),
            'status' => AccountStatus::ACTIVE,
            'email_verified_at' => now(),
        ]);
        $support->roles()->sync([$supportAdminRole->id]);

        // 3. Service Zones
        $centralZone = \App\Models\Zone::firstOrCreate(['name' => 'Kanpur Central Zone'], [
            'city' => 'Kanpur',
            'center_latitude' => 26.4499000,
            'center_longitude' => 80.3319000,
            'radius_km' => 15,
            'is_active' => true,
        ]);

        $southZone = \App\Models\Zone::firstOrCreate(['name' => 'Kanpur South Zone'], [
            'city' => 'Kanpur',
            'center_latitude' => 26.4150000,
            'center_longitude' => 80.3150000,
            'radius_km' => 12,
            'is_active' => true,
        ]);

        // 4. Restaurant Partner 1: Dastak Biryani Mahal
        $owner1 = User::firstOrCreate(['email' => 'biryani@dastakdelivery.com'], [
            'name' => 'Mohd. Tariq',
            'mobile' => '9888800001',
            'password' => Hash::make('password123'),
            'status' => AccountStatus::ACTIVE,
            'email_verified_at' => now(),
        ]);
        $owner1->roles()->sync([$restaurantRole->id]);

        $restaurant1 = Restaurant::firstOrCreate(['name' => 'Dastak Biryani Mahal'], [
            'owner_id' => $owner1->id,
            'zone_id' => $centralZone->id,
            'phone' => '9888800001',
            'email' => 'biryani@dastakdelivery.com',
            'address_line1' => 'Opposite Phool Bagh, Civil Lines',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4520000,
            'longitude' => 80.3340000,
            'commission_rate' => 15.00,
            'is_pure_veg' => false,
            'preparation_time_minutes' => 25,
            'min_order_value' => 150.00,
            'rating' => 4.80,
            'total_ratings' => 120,
            'is_open' => true,
            'is_active' => true,
        ]);

        for ($day = 0; $day <= 6; $day++) {
            RestaurantOperatingHour::firstOrCreate([
                'restaurant_id' => $restaurant1->id,
                'day_of_week' => $day,
            ], [
                'opening_time' => '11:00:00',
                'closing_time' => '23:30:00',
                'is_closed' => false,
            ]);
        }

        // Restaurant 1 Categories & Items
        $catBiryani = MenuCategory::firstOrCreate(['restaurant_id' => $restaurant1->id, 'name' => 'Dum Biryani'], ['is_active' => true, 'sort_order' => 1]);
        $catStarters = MenuCategory::firstOrCreate(['restaurant_id' => $restaurant1->id, 'name' => 'Tandoori Starters'], ['is_active' => true, 'sort_order' => 2]);

        $item1 = MenuItem::firstOrCreate(['restaurant_id' => $restaurant1->id, 'name' => 'Hyderabadi Chicken Dum Biryani'], [
            'category_id' => $catBiryani->id,
            'description' => 'Fragrant basmati rice cooked with succulent chicken pieces in authentic spices.',
            'base_price' => 280.00,
            'food_type' => FoodType::NON_VEG,
            'is_available' => true,
            'is_recommended' => true,
        ]);

        // Variant Group: Portion Size
        $vGroup = MenuItemVariantGroup::firstOrCreate(['menu_item_id' => $item1->id, 'name' => 'Portion Size'], ['is_required' => true]);
        MenuItemVariant::firstOrCreate(['variant_group_id' => $vGroup->id, 'name' => 'Half (Serves 1)'], ['price' => 280.00, 'is_default' => true]);
        MenuItemVariant::firstOrCreate(['variant_group_id' => $vGroup->id, 'name' => 'Full (Serves 2)'], ['price' => 480.00, 'is_default' => false]);

        // Add-on Group: Accompaniments
        $aGroup = MenuItemAddonGroup::firstOrCreate(['menu_item_id' => $item1->id, 'name' => 'Accompaniments & Dips'], ['min_selection' => 0, 'max_selection' => 3]);
        MenuItemAddon::firstOrCreate(['addon_group_id' => $aGroup->id, 'name' => 'Special Burani Raita'], ['price' => 40.00]);
        MenuItemAddon::firstOrCreate(['addon_group_id' => $aGroup->id, 'name' => 'Extra Salan Gravy'], ['price' => 30.00]);
        MenuItemAddon::firstOrCreate(['addon_group_id' => $aGroup->id, 'name' => 'Boiled Egg (2 Pcs)'], ['price' => 35.00]);

        // 5. Restaurant Partner 2: Kanpur Sweets & Chaat (100% Pure Veg)
        $owner2 = User::firstOrCreate(['email' => 'sweets@dastakdelivery.com'], [
            'name' => 'Sunil Gupta',
            'mobile' => '9888800002',
            'password' => Hash::make('password123'),
            'status' => AccountStatus::ACTIVE,
            'email_verified_at' => now(),
        ]);
        $owner2->roles()->sync([$restaurantRole->id]);

        $restaurant2 = Restaurant::firstOrCreate(['name' => 'Kanpur Sweets & Chaat House'], [
            'owner_id' => $owner2->id,
            'zone_id' => $centralZone->id,
            'phone' => '9888800002',
            'email' => 'sweets@dastakdelivery.com',
            'address_line1' => 'Birhana Road',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4480000,
            'longitude' => 80.3300000,
            'commission_rate' => 12.00,
            'is_pure_veg' => true,
            'preparation_time_minutes' => 15,
            'min_order_value' => 100.00,
            'rating' => 4.90,
            'total_ratings' => 210,
            'is_open' => true,
            'is_active' => true,
        ]);

        $catChaat = MenuCategory::firstOrCreate(['restaurant_id' => $restaurant2->id, 'name' => 'Kanpuri Chaat & Snacks'], ['is_active' => true, 'sort_order' => 1]);
        MenuItem::firstOrCreate(['restaurant_id' => $restaurant2->id, 'name' => 'Special Matar Chaat & Batashe'], [
            'category_id' => $catChaat->id,
            'description' => 'Crispy puris filled with spicy tangy matar and 5 flavours of water.',
            'base_price' => 80.00,
            'food_type' => FoodType::VEG,
            'is_available' => true,
            'is_recommended' => true,
        ]);
        MenuItem::firstOrCreate(['restaurant_id' => $restaurant2->id, 'name' => 'Desi Ghee Jalebi (250g)'], [
            'category_id' => $catChaat->id,
            'description' => 'Crispy hot golden jalebis soaked in fragrant saffron syrup.',
            'base_price' => 120.00,
            'food_type' => FoodType::VEG,
            'is_available' => true,
            'is_recommended' => true,
        ]);

        // 6. Delivery Riders
        $rider1 = User::firstOrCreate(['email' => 'rahul.rider@dastakdelivery.com'], [
            'name' => 'Rahul Verma',
            'mobile' => '9777700001',
            'password' => Hash::make('password123'),
            'status' => AccountStatus::ACTIVE,
            'email_verified_at' => now(),
        ]);
        $rider1->roles()->sync([$riderRole->id]);
        $rider1->deliveryProfile()->updateOrCreate(['user_id' => $rider1->id], [
            'vehicle_type' => VehicleType::MOTORCYCLE,
            'vehicle_number' => 'UP78-AB-1234',
            'driving_license_number' => 'DL-UP78-2023001',
            'is_online' => true,
            'is_busy' => false,
            'current_latitude' => 26.4520000,
            'current_longitude' => 80.3340000,
            'last_location_updated_at' => now(),
            'rating' => 4.95,
            'total_ratings' => 85,
            'total_deliveries' => 92,
        ]);

        $rider2 = User::firstOrCreate(['email' => 'amit.rider@dastakdelivery.com'], [
            'name' => 'Amit Kumar',
            'mobile' => '9777700002',
            'password' => Hash::make('password123'),
            'status' => AccountStatus::ACTIVE,
            'email_verified_at' => now(),
        ]);
        $rider2->roles()->sync([$riderRole->id]);
        $rider2->deliveryProfile()->updateOrCreate(['user_id' => $rider2->id], [
            'vehicle_type' => VehicleType::SCOOTER,
            'vehicle_number' => 'UP78-CD-5678',
            'driving_license_number' => 'DL-UP78-2023002',
            'is_online' => true,
            'is_busy' => false,
            'current_latitude' => 26.4480000,
            'current_longitude' => 80.3300000,
            'last_location_updated_at' => now(),
            'rating' => 4.80,
            'total_ratings' => 45,
            'total_deliveries' => 48,
        ]);

        // 7. Customers & Addresses
        $customer1 = User::firstOrCreate(['email' => 'priya@gmail.com'], [
            'name' => 'Priya Sharma',
            'mobile' => '9666600001',
            'password' => Hash::make('password123'),
            'status' => AccountStatus::ACTIVE,
            'email_verified_at' => now(),
        ]);
        $customer1->roles()->sync([$customerRole->id]);
        $customer1->customerProfile()->updateOrCreate(['user_id' => $customer1->id], [
            'gender' => 'FEMALE',
            'loyalty_points' => 250,
        ]);
        Address::firstOrCreate(['user_id' => $customer1->id, 'type' => 'HOME'], [
            'contact_name' => 'Priya Sharma',
            'contact_mobile' => '9666600001',
            'address_line1' => 'Flat 402, Ganga Heights, Civil Lines',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4500000,
            'longitude' => 80.3320000,
            'is_default' => true,
        ]);

        // 8. Promotional Coupons
        Coupon::firstOrCreate(['code' => 'FIRST50'], [
            'title' => '50% OFF on First Order',
            'description' => 'Get 50% discount up to Rs. 100 on your meal',
            'discount_type' => \App\Enums\DiscountType::PERCENTAGE,
            'discount_value' => 50.00,
            'max_discount_amount' => 100.00,
            'min_order_value' => 199.00,
            'usage_limit_per_user' => 1,
            'is_active' => true,
            'starts_at' => now()->subDay(),
            'expires_at' => now()->addMonths(6),
        ]);

        Coupon::firstOrCreate(['code' => 'DASTAK100'], [
            'title' => 'Flat Rs. 100 OFF',
            'description' => 'Flat Rs. 100 off on orders above Rs. 499',
            'discount_type' => \App\Enums\DiscountType::FIXED,
            'discount_value' => 100.00,
            'min_order_value' => 499.00,
            'usage_limit_per_user' => 3,
            'is_active' => true,
            'starts_at' => now()->subDay(),
            'expires_at' => now()->addMonths(6),
        ]);

        // 9. Deterministic admin-panel bypass token for the Super Admin.
        $this->call(AdminBypassTokenSeeder::class);

        // 10. Demo transactional data so the admin panel renders live content.
        $this->call(DemoOrdersSeeder::class);
        $this->call(DemoSupportSeeder::class);
    }
}
