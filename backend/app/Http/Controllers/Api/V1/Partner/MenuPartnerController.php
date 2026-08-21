<?php

namespace App\Http\Controllers\Api\V1\Partner;

use App\Http\Controllers\Controller;
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
        protected MenuService $menuService,
        protected \App\Services\FoodImageSearchService $imageSearchService
    ) {}

    protected function getPartnerRestaurant(Request $request): Restaurant
    {
        $restaurant = $request->user()?->restaurants()->first();

        if (! $restaurant) {
            $restaurant = Restaurant::where('name', 'like', '%Chay Chaupal%')->first() ?? Restaurant::first();
        }

        if (! $restaurant) {
            abort(404, 'No restaurant associated with this partner account.');
        }

        return $restaurant;
    }

    /** Hierarchical menu tree: top categories -> items + sub-categories -> items. */
    public function tree(Request $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);

        $categories = MenuCategory::where('restaurant_id', $restaurant->id)
            ->whereNull('parent_id')
            ->with([
                'items' => fn ($q) => $q->orderBy('sort_order'),
                'subcategories.items' => fn ($q) => $q->orderBy('sort_order'),
            ])
            ->orderBy('sort_order')
            ->get();

        $tree = $categories->map(fn ($cat) => [
            'id' => $cat->id,
            'category' => $cat->name,
            'name' => $cat->name,
            'image' => $this->url($cat->image),
            'is_active' => (bool) $cat->is_active,
            'items' => $cat->items->map(fn ($i) => $this->itemArray($i))->values(),
            'subcategories' => $cat->subcategories->map(fn ($sub) => [
                'id' => $sub->id,
                'category' => $sub->name,
                'name' => $sub->name,
                'image' => $this->url($sub->image),
                'is_active' => (bool) $sub->is_active,
                'items' => $sub->items->map(fn ($i) => $this->itemArray($i))->values(),
            ])->values(),
        ])->values();

        return ApiResponse::success($tree, 'Restaurant menu retrieved.');
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

    public function storeCategory(Request $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'parent_id' => ['nullable', 'integer', 'exists:menu_categories,id'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $category = MenuCategory::create([
            'restaurant_id' => $restaurant->id,
            'parent_id' => $data['parent_id'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'image' => $data['image'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => true,
        ]);

        return ApiResponse::success(new MenuCategoryResource($category), 'Category created.', 201);
    }

    public function updateCategory(Request $request, int $categoryId): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        $category = MenuCategory::where('restaurant_id', $restaurant->id)->findOrFail($categoryId);

        $category->update($request->only(['name', 'description', 'image', 'sort_order', 'is_active', 'parent_id']));

        return ApiResponse::success(new MenuCategoryResource($category), 'Category updated.');
    }

    public function destroyCategory(Request $request, int $categoryId): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        $category = MenuCategory::where('restaurant_id', $restaurant->id)->findOrFail($categoryId);

        // Remove items in this category and its sub-categories, then the categories.
        $categoryIds = collect([$category->id])->merge($category->subcategories()->pluck('id'));
        MenuItem::whereIn('category_id', $categoryIds)->delete();
        MenuCategory::where('parent_id', $category->id)->delete();
        $category->delete();

        return ApiResponse::success(null, 'Category deleted with its items.');
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

    public function storeItem(Request $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        $data = $this->validateItem($request, true);

        $item = $this->menuService->createMenuItem(
            $restaurant,
            [
                'category_id' => $data['category_id'],
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'image' => $data['image'] ?? null,
                'base_price' => $data['price'],
                'discount_price' => $data['discount_price'] ?? null,
                'food_type' => ($data['is_veg'] ?? false) ? 'VEG' : 'NON_VEG',
                'is_available' => $data['is_available'] ?? true,
                'preparation_time_minutes' => $data['prep_time'] ?? 15,
                'short_code' => $data['short_code'] ?? null,
            ],
            $request->input('variant_groups'),
            $request->input('addon_groups')
        );

        return ApiResponse::success(new MenuItemResource($item), 'Menu item created.', 201);
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

    public function updateItem(Request $request, int $itemId): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        $item = MenuItem::where('restaurant_id', $restaurant->id)->findOrFail($itemId);
        $data = $this->validateItem($request, false);

        $update = [];
        foreach (['name', 'description', 'image', 'short_code'] as $f) {
            if (array_key_exists($f, $data)) {
                $update[$f] = $data[$f];
            }
        }
        if (array_key_exists('category_id', $data)) $update['category_id'] = $data['category_id'];
        if (array_key_exists('price', $data)) $update['base_price'] = $data['price'];
        if (array_key_exists('discount_price', $data)) $update['discount_price'] = $data['discount_price'];
        if (array_key_exists('prep_time', $data)) $update['preparation_time_minutes'] = $data['prep_time'];
        if (array_key_exists('is_available', $data)) $update['is_available'] = (bool) $data['is_available'];
        if (array_key_exists('is_veg', $data)) $update['food_type'] = $data['is_veg'] ? 'VEG' : 'NON_VEG';

        $item->update($update);

        return ApiResponse::success($this->itemArray($item->fresh()), 'Menu item updated.');
    }

    public function destroyItem(Request $request, int $itemId): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        MenuItem::where('restaurant_id', $restaurant->id)->findOrFail($itemId)->delete();

        return ApiResponse::success(null, 'Menu item deleted.');
    }

    public function toggleItemAvailability(Request $request, int $itemId): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);
        $item = MenuItem::where('restaurant_id', $restaurant->id)->findOrFail($itemId);
        $item->update(['is_available' => (bool) $request->input('is_available', ! $item->is_available)]);

        return ApiResponse::success(
            ['id' => $item->id, 'is_available' => (bool) $item->is_available],
            'Availability updated.'
        );
    }

    /** Search royalty-free high quality food images for dish naming. */
    public function searchFoodImages(Request $request): JsonResponse
    {
        $query = $request->query('q', $request->query('query', 'delicious food'));
        $results = $this->imageSearchService->search((string) $query, 16);

        return ApiResponse::success($results, 'Food images retrieved.');
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);

        $request->validate([
            'image' => ['nullable', 'image', 'max:10240'],
            'image_url' => ['nullable', 'string', 'url'],
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('menu/'.$restaurant->id, 'public');
        } elseif ($request->filled('image_url')) {
            $path = $this->imageSearchService->downloadAndStore($request->input('image_url'), $restaurant->id);
            if (! $path) {
                return ApiResponse::error('Failed to download image from web source.', 422);
            }
        } else {
            return ApiResponse::error('Please provide an image file or a valid image_url.', 422);
        }

        return ApiResponse::success(
            ['url' => asset('storage/'.$path)],
            'Image uploaded and stored successfully.',
            201
        );
    }

    protected function validateItem(Request $request, bool $isCreate): array
    {
        if (! $request->has('price') && $request->has('base_price')) {
            $request->merge(['price' => $request->input('base_price')]);
        }

        return $request->validate([
            'name' => [$isCreate ? 'required' : 'sometimes', 'string', 'max:150'],
            'category_id' => [$isCreate ? 'required' : 'sometimes', 'integer', 'exists:menu_categories,id'],
            'price' => [$isCreate ? 'required' : 'sometimes', 'numeric', 'min:0'],
            'base_price' => ['nullable', 'numeric', 'min:0'],
            'discount_price' => ['nullable', 'numeric', 'min:0'],
            'is_veg' => ['nullable', 'boolean'],
            'is_available' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string'],
            'prep_time' => ['nullable', 'integer', 'min:0'],
            'short_code' => ['nullable', 'string', 'max:50'],
            'variant_groups' => ['nullable', 'array'],
            'addon_groups' => ['nullable', 'array'],
        ]);
    }

    protected function itemArray(MenuItem $item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'description' => $item->description,
            'image' => $this->url($item->image),
            'is_veg' => $item->food_type?->value === 'VEG' || $item->food_type === 'VEG',
            'price' => (float) $item->base_price,
            'discount_price' => $item->discount_price !== null ? (float) $item->discount_price : null,
            'is_available' => (bool) $item->is_available,
            'prep_time' => ($item->preparation_time_minutes ?? 15).' mins',
            'category_id' => $item->category_id,
            'short_code' => $item->short_code,
        ];
    }

    protected function url(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return str_starts_with($path, 'http') ? $path : asset('storage/'.ltrim($path, '/'));
    }
}
