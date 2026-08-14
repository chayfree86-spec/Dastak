<?php

namespace App\Http\Controllers\Api\V1\Partner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Menu\StoreCategoryRequest;
use App\Http\Requests\Menu\StoreMenuItemRequest;
use App\Http\Requests\Menu\ToggleAvailabilityRequest;
use App\Http\Requests\Menu\UpdateCategoryRequest;
use App\Http\Requests\Menu\UpdateMenuItemRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\MenuCategoryResource;
use App\Http\Resources\MenuItemResource;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Services\MenuService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuPartnerController extends Controller
{
    public function __construct(
        protected MenuService $menuService
    ) {}

    protected function getPartnerRestaurant(Request $request): Restaurant
    {
        $restaurant = $request->user()->restaurants()->first();

        if (! $restaurant) {
            abort(404, 'No restaurant associated with this partner account.');
        }

        return $restaurant;
    }

    // --- Category Handlers ---

    public function getCategories(Request $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        $categories = $this->menuService->getCategories($restaurant);

        return ApiResponse::success(
            MenuCategoryResource::collection($categories),
            'Categories retrieved successfully.'
        );
    }

    public function storeCategory(StoreCategoryRequest $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        $category = $this->menuService->createCategory($restaurant, $request->validated());

        return ApiResponse::success(
            new MenuCategoryResource($category),
            'Category created successfully.',
            201
        );
    }

    public function updateCategory(UpdateCategoryRequest $request, MenuCategory $category): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        if ($category->restaurant_id !== $restaurant->id) {
            abort(403, 'Unauthorized access to this category.');
        }

        $updated = $this->menuService->updateCategory($category, $request->validated());

        return ApiResponse::success(
            new MenuCategoryResource($updated),
            'Category updated successfully.'
        );
    }

    public function destroyCategory(Request $request, MenuCategory $category): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        if ($category->restaurant_id !== $restaurant->id) {
            abort(403, 'Unauthorized access to this category.');
        }

        $this->menuService->deleteCategory($category);

        return ApiResponse::success(null, 'Category deleted successfully.');
    }

    // --- Menu Item Handlers ---

    public function getItems(Request $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        $filters = $request->only(['category_id', 'food_type', 'is_available', 'search']);
        $items = $this->menuService->getMenuItems($restaurant, $filters);

        return ApiResponse::success(
            MenuItemResource::collection($items),
            'Menu items retrieved successfully.'
        );
    }

    public function storeItem(StoreMenuItemRequest $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        $itemData = $request->except(['variant_groups', 'addon_groups']);
        $variantGroups = $request->input('variant_groups');
        $addonGroups = $request->input('addon_groups');

        $item = $this->menuService->createMenuItem(
            restaurant: $restaurant,
            itemData: $itemData,
            variantGroupsData: $variantGroups,
            addonGroupsData: $addonGroups
        );

        return ApiResponse::success(
            new MenuItemResource($item),
            'Menu item created successfully.',
            201
        );
    }

    public function showItem(Request $request, MenuItem $item): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        if ($item->restaurant_id !== $restaurant->id) {
            abort(403, 'Unauthorized access to this menu item.');
        }

        return ApiResponse::success(
            new MenuItemResource($item->load(['category', 'variantGroups.variants', 'addonGroups.addons'])),
            'Menu item retrieved successfully.'
        );
    }

    public function updateItem(UpdateMenuItemRequest $request, MenuItem $item): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        if ($item->restaurant_id !== $restaurant->id) {
            abort(403, 'Unauthorized access to this menu item.');
        }

        $itemData = $request->except(['variant_groups', 'addon_groups']);
        $variantGroups = $request->input('variant_groups');
        $addonGroups = $request->input('addon_groups');

        $updated = $this->menuService->updateMenuItem(
            item: $item,
            itemData: $itemData,
            variantGroupsData: $variantGroups,
            addonGroupsData: $addonGroups
        );

        return ApiResponse::success(
            new MenuItemResource($updated),
            'Menu item updated successfully.'
        );
    }

    public function destroyItem(Request $request, MenuItem $item): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        if ($item->restaurant_id !== $restaurant->id) {
            abort(403, 'Unauthorized access to this menu item.');
        }

        $this->menuService->deleteMenuItem($item);

        return ApiResponse::success(null, 'Menu item deleted successfully.');
    }

    public function toggleItemAvailability(ToggleAvailabilityRequest $request, MenuItem $item): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        if ($item->restaurant_id !== $restaurant->id) {
            abort(403, 'Unauthorized access to this menu item.');
        }

        $isAvailable = (bool) $request->input('is_available');
        $updated = $this->menuService->toggleItemAvailability($item, $isAvailable);

        $statusStr = $isAvailable ? 'in-stock' : 'out-of-stock';

        return ApiResponse::success(
            new MenuItemResource($updated),
            "Item status updated to {$statusStr}."
        );
    }
}
