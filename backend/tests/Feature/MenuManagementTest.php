<?php

namespace Tests\Feature;

use App\Enums\AccountStatus;
use App\Enums\FoodType;
use App\Enums\UserRole;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MenuManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_partner_can_create_category_and_menu_item_with_variants_and_addons(): void
    {
        $partner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $partner->assignRole(UserRole::RESTAURANT);

        $restaurant = Restaurant::create([
            'owner_id' => $partner->id,
            'name' => 'Biryani Central',
            'phone' => '9876543210',
            'address_line1' => 'Mall Road',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
        ]);

        // 1. Create Category
        $catResponse = $this->actingAs($partner, 'sanctum')->postJson('/api/v1/partner/menu/categories', [
            'name' => 'Hyderabadi Dum Biryani',
            'description' => 'Authentic slow-cooked royal biryanis',
        ]);

        $catResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Hyderabadi Dum Biryani');

        $categoryId = $catResponse->json('data.id');

        // 2. Create Item with Variants & Addons
        $itemResponse = $this->actingAs($partner, 'sanctum')->postJson('/api/v1/partner/menu/items', [
            'category_id' => $categoryId,
            'name' => 'Special Chicken Dum Biryani',
            'description' => 'Served with Mirchi Ka Salan and Raita',
            'base_price' => 220.00,
            'discount_price' => 199.00,
            'food_type' => FoodType::NON_VEG->value,
            'is_recommended' => true,
            'variant_groups' => [
                [
                    'name' => 'Portion Size',
                    'min_selection' => 1,
                    'max_selection' => 1,
                    'is_required' => true,
                    'variants' => [
                        ['name' => 'Half (Serves 1)', 'price' => 199.00, 'is_default' => true],
                        ['name' => 'Full (Serves 2-3)', 'price' => 349.00, 'is_default' => false],
                    ],
                ],
            ],
            'addon_groups' => [
                [
                    'name' => 'Extra Accompaniments',
                    'min_selection' => 0,
                    'max_selection' => 3,
                    'addons' => [
                        ['name' => 'Extra Salan Gravy', 'price' => 30.00],
                        ['name' => 'Boiled Egg (2 Pcs)', 'price' => 40.00],
                    ],
                ],
            ],
        ]);

        $itemResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Special Chicken Dum Biryani')
            ->assertJsonPath('data.variant_groups.0.variants.1.name', 'Full (Serves 2-3)')
            ->assertJsonPath('data.addon_groups.0.addons.0.price', 30);
    }

    public function test_public_menu_endpoint_returns_nested_catalog_tree(): void
    {
        $partner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $partner->assignRole(UserRole::RESTAURANT);

        $restaurant = Restaurant::create([
            'owner_id' => $partner->id,
            'name' => 'Pizza House',
            'phone' => '9876543210',
            'address_line1' => 'Civil Lines',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
        ]);

        $cat = MenuCategory::create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Gourmet Pizzas',
        ]);

        MenuItem::create([
            'restaurant_id' => $restaurant->id,
            'category_id' => $cat->id,
            'name' => 'Farmhouse Delight',
            'base_price' => 299.00,
            'food_type' => FoodType::VEG,
            'is_available' => true,
        ]);

        $response = $this->getJson("/api/v1/restaurants/{$restaurant->slug}/menu");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.name', 'Gourmet Pizzas')
            ->assertJsonPath('data.0.items.0.name', 'Farmhouse Delight');
    }

    public function test_partner_can_toggle_item_availability(): void
    {
        $partner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $partner->assignRole(UserRole::RESTAURANT);

        $restaurant = Restaurant::create([
            'owner_id' => $partner->id,
            'name' => 'Burger Hub',
            'phone' => '9876543210',
            'address_line1' => 'Kakadeo',
            'city' => 'Kanpur',
            'pincode' => '208025',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
        ]);

        $cat = MenuCategory::create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Burgers',
        ]);

        $item = MenuItem::create([
            'restaurant_id' => $restaurant->id,
            'category_id' => $cat->id,
            'name' => 'Crispy Veg Burger',
            'base_price' => 99.00,
            'food_type' => FoodType::VEG,
            'is_available' => true,
        ]);

        // Toggle Out of Stock
        $response = $this->actingAs($partner, 'sanctum')
            ->patchJson("/api/v1/partner/menu/items/{$item->id}/toggle-availability", [
                'is_available' => false,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_available', false);

        $this->assertFalse((bool) $item->fresh()->is_available);
    }
}
