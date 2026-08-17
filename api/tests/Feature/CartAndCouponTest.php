<?php

namespace Tests\Feature;

use App\Enums\AccountStatus;
use App\Enums\DiscountType;
use App\Enums\FoodType;
use App\Enums\UserRole;
use App\Models\Coupon;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\MenuItemAddon;
use App\Models\MenuItemAddonGroup;
use App\Models\MenuItemVariant;
use App\Models\MenuItemVariantGroup;
use App\Models\Restaurant;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartAndCouponTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_customer_can_add_item_with_variant_and_addons_to_cart(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);

        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Burger House',
            'phone' => '9876543210',
            'address_line1' => 'Mall Road',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'is_open' => true,
            'is_active' => true,
        ]);

        $cat = MenuCategory::create(['restaurant_id' => $restaurant->id, 'name' => 'Burgers']);
        $item = MenuItem::create([
            'restaurant_id' => $restaurant->id,
            'category_id' => $cat->id,
            'name' => 'Zinger Burger',
            'base_price' => 150.00,
            'food_type' => FoodType::NON_VEG,
            'is_available' => true,
        ]);

        $varGroup = MenuItemVariantGroup::create(['menu_item_id' => $item->id, 'name' => 'Size']);
        $variant = MenuItemVariant::create([
            'variant_group_id' => $varGroup->id,
            'name' => 'Double Patty',
            'price' => 220.00,
            'is_available' => true,
        ]);

        $addonGroup = MenuItemAddonGroup::create(['menu_item_id' => $item->id, 'name' => 'Addons']);
        $addon = MenuItemAddon::create([
            'addon_group_id' => $addonGroup->id,
            'name' => 'Extra Cheese',
            'price' => 25.00,
            'is_available' => true,
        ]);

        // Add 2 quantity of Double Patty (220) + Extra Cheese (25) = (245 * 2) = 490 Subtotal
        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/v1/customer/cart/items', [
            'restaurant_id' => $restaurant->id,
            'menu_item_id' => $item->id,
            'variant_id' => $variant->id,
            'addon_ids' => [$addon->id],
            'quantity' => 2,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.bill.subtotal', 490)
            ->assertJsonPath('data.items_count', 2);
    }

    public function test_single_restaurant_cart_constraint_rejects_different_restaurant_item(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);

        $restaurantA = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Restaurant A',
            'phone' => '9876543210',
            'address_line1' => 'Road A',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'is_open' => true,
            'is_active' => true,
        ]);

        $restaurantB = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Restaurant B',
            'phone' => '9876543211',
            'address_line1' => 'Road B',
            'city' => 'Kanpur',
            'pincode' => '208002',
            'latitude' => 26.4500,
            'longitude' => 80.3320,
            'is_open' => true,
            'is_active' => true,
        ]);

        $catA = MenuCategory::create(['restaurant_id' => $restaurantA->id, 'name' => 'Cat A']);
        $itemA = MenuItem::create(['restaurant_id' => $restaurantA->id, 'category_id' => $catA->id, 'name' => 'Item A', 'base_price' => 100.00, 'food_type' => FoodType::VEG, 'is_available' => true]);

        $catB = MenuCategory::create(['restaurant_id' => $restaurantB->id, 'name' => 'Cat B']);
        $itemB = MenuItem::create(['restaurant_id' => $restaurantB->id, 'category_id' => $catB->id, 'name' => 'Item B', 'base_price' => 120.00, 'food_type' => FoodType::VEG, 'is_available' => true]);

        // Add from Restaurant A
        $this->actingAs($customer, 'sanctum')->postJson('/api/v1/customer/cart/items', [
            'restaurant_id' => $restaurantA->id,
            'menu_item_id' => $itemA->id,
            'quantity' => 1,
        ]);

        // Try adding from Restaurant B without force clear
        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/v1/customer/cart/items', [
            'restaurant_id' => $restaurantB->id,
            'menu_item_id' => $itemB->id,
            'quantity' => 1,
            'force_clear' => false,
        ]);

        $response->assertStatus(422);

        // Try adding from Restaurant B with force clear = true
        $forceResponse = $this->actingAs($customer, 'sanctum')->postJson('/api/v1/customer/cart/items', [
            'restaurant_id' => $restaurantB->id,
            'menu_item_id' => $itemB->id,
            'quantity' => 1,
            'force_clear' => true,
        ]);

        $forceResponse->assertStatus(201)
            ->assertJsonPath('data.restaurant_id', $restaurantB->id)
            ->assertJsonPath('data.items_count', 1);
    }

    public function test_customer_can_apply_percentage_coupon_and_get_calculated_discount(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);

        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Tandoor Express',
            'phone' => '9876543210',
            'address_line1' => 'Mall Road',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'is_open' => true,
            'is_active' => true,
        ]);

        $cat = MenuCategory::create(['restaurant_id' => $restaurant->id, 'name' => 'Meals']);
        $item = MenuItem::create([
            'restaurant_id' => $restaurant->id,
            'category_id' => $cat->id,
            'name' => 'Deluxe Thali',
            'base_price' => 300.00,
            'food_type' => FoodType::VEG,
            'is_available' => true,
        ]);

        // Add to cart: 2 * 300 = 600 Subtotal
        $this->actingAs($customer, 'sanctum')->postJson('/api/v1/customer/cart/items', [
            'restaurant_id' => $restaurant->id,
            'menu_item_id' => $item->id,
            'quantity' => 2,
        ]);

        // Create Coupon: 50% discount up to ₹100, min order ₹200
        Coupon::create([
            'code' => 'WELCOME50',
            'title' => '50% off up to ₹100',
            'discount_type' => DiscountType::PERCENTAGE,
            'discount_value' => 50.00,
            'max_discount_amount' => 100.00,
            'min_order_value' => 200.00,
            'is_active' => true,
        ]);

        $couponResponse = $this->actingAs($customer, 'sanctum')->postJson('/api/v1/customer/cart/apply-coupon', [
            'code' => 'WELCOME50',
        ]);

        $couponResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.bill.subtotal', 600)
            ->assertJsonPath('data.bill.discount_amount', 100);
    }
}
