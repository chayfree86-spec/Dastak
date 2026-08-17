<?php

namespace App\Services;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\MenuItemAddon;
use App\Models\MenuItemAddonGroup;
use App\Models\MenuItemVariant;
use App\Models\MenuItemVariantGroup;
use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class MenuService
{
    public function getPublicRestaurantMenu(Restaurant $restaurant): Collection
    {
        return $restaurant->menuCategories()
            ->where('is_active', true)
            ->with(['items' => function ($query) {
                $query->where('is_available', true)
                    ->with(['variantGroups.variants', 'addonGroups.addons']);
            }])
            ->get();
    }

    public function getCategories(Restaurant $restaurant): Collection
    {
        return $restaurant->menuCategories()->withCount('items')->get();
    }

    public function createCategory(Restaurant $restaurant, array $data): MenuCategory
    {
        $data['restaurant_id'] = $restaurant->id;
        return MenuCategory::create($data);
    }

    public function updateCategory(MenuCategory $category, array $data): MenuCategory
    {
        $category->update($data);
        return $category->fresh();
    }

    public function deleteCategory(MenuCategory $category): void
    {
        $category->delete();
    }

    public function getMenuItems(Restaurant $restaurant, array $filters = []): Collection
    {
        $query = $restaurant->menuItems()->with(['category', 'variantGroups.variants', 'addonGroups.addons']);

        if (! empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (! empty($filters['food_type'])) {
            $query->where('food_type', $filters['food_type']);
        }

        if (isset($filters['is_available'])) {
            $query->where('is_available', (bool) $filters['is_available']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where('name', 'like', "%{$search}%");
        }

        return $query->get();
    }

    public function createMenuItem(
        Restaurant $restaurant,
        array $itemData,
        ?array $variantGroupsData = null,
        ?array $addonGroupsData = null
    ): MenuItem {
        return DB::transaction(function () use ($restaurant, $itemData, $variantGroupsData, $addonGroupsData) {
            $itemData['restaurant_id'] = $restaurant->id;
            $item = MenuItem::create($itemData);

            // Sync Variant Groups & Variants
            if (! empty($variantGroupsData)) {
                $this->syncVariantGroups($item, $variantGroupsData);
            }

            // Sync Addon Groups & Addons
            if (! empty($addonGroupsData)) {
                $this->syncAddonGroups($item, $addonGroupsData);
            }

            return $item->fresh(['category', 'variantGroups.variants', 'addonGroups.addons']);
        });
    }

    public function updateMenuItem(
        MenuItem $item,
        array $itemData,
        ?array $variantGroupsData = null,
        ?array $addonGroupsData = null
    ): MenuItem {
        return DB::transaction(function () use ($item, $itemData, $variantGroupsData, $addonGroupsData) {
            $item->update($itemData);

            if ($variantGroupsData !== null) {
                $this->syncVariantGroups($item, $variantGroupsData);
            }

            if ($addonGroupsData !== null) {
                $this->syncAddonGroups($item, $addonGroupsData);
            }

            return $item->fresh(['category', 'variantGroups.variants', 'addonGroups.addons']);
        });
    }

    public function deleteMenuItem(MenuItem $item): void
    {
        $item->delete();
    }

    public function toggleItemAvailability(MenuItem $item, bool $isAvailable): MenuItem
    {
        $item->update(['is_available' => $isAvailable]);
        return $item->fresh();
    }

    protected function syncVariantGroups(MenuItem $item, array $groups): void
    {
        // Simple and robust: replace existing variant groups with new structure
        $item->variantGroups()->delete();

        foreach ($groups as $groupData) {
            $group = MenuItemVariantGroup::create([
                'menu_item_id' => $item->id,
                'name' => $groupData['name'],
                'min_selection' => $groupData['min_selection'] ?? 1,
                'max_selection' => $groupData['max_selection'] ?? 1,
                'is_required' => $groupData['is_required'] ?? true,
                'sort_order' => $groupData['sort_order'] ?? 0,
            ]);

            if (! empty($groupData['variants'])) {
                foreach ($groupData['variants'] as $variantData) {
                    MenuItemVariant::create([
                        'variant_group_id' => $group->id,
                        'name' => $variantData['name'],
                        'price' => $variantData['price'],
                        'is_default' => $variantData['is_default'] ?? false,
                        'is_available' => $variantData['is_available'] ?? true,
                        'sort_order' => $variantData['sort_order'] ?? 0,
                    ]);
                }
            }
        }
    }

    protected function syncAddonGroups(MenuItem $item, array $groups): void
    {
        $item->addonGroups()->delete();

        foreach ($groups as $groupData) {
            $group = MenuItemAddonGroup::create([
                'menu_item_id' => $item->id,
                'name' => $groupData['name'],
                'min_selection' => $groupData['min_selection'] ?? 0,
                'max_selection' => $groupData['max_selection'] ?? 5,
                'sort_order' => $groupData['sort_order'] ?? 0,
            ]);

            if (! empty($groupData['addons'])) {
                foreach ($groupData['addons'] as $addonData) {
                    MenuItemAddon::create([
                        'addon_group_id' => $group->id,
                        'name' => $addonData['name'],
                        'price' => $addonData['price'] ?? 0.00,
                        'is_available' => $addonData['is_available'] ?? true,
                        'sort_order' => $addonData['sort_order'] ?? 0,
                    ]);
                }
            }
        }
    }
}
