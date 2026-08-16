<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Full menu management for a restaurant (admin Menu & Items tab):
 * hierarchical categories -> sub-categories -> items, each with an image.
 * Also serves flexible image uploads (any image, any size).
 */
class MenuAdminController extends Controller
{
    /** Hierarchical menu tree: top categories -> items + sub-categories -> items. */
    public function menu(int $restaurantId): JsonResponse
    {
        $categories = MenuCategory::where('restaurant_id', $restaurantId)
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

    public function storeCategory(Request $request, int $restaurantId): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'parent_id' => ['nullable', 'integer', 'exists:menu_categories,id'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $category = MenuCategory::create([
            'restaurant_id' => $restaurantId,
            'parent_id' => $data['parent_id'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'image' => $data['image'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => true,
        ]);

        return ApiResponse::success(['id' => $category->id], 'Category created.', 201);
    }

    public function updateCategory(Request $request, int $restaurantId, int $categoryId): JsonResponse
    {
        $category = MenuCategory::where('restaurant_id', $restaurantId)->findOrFail($categoryId);

        $category->update($request->only(['name', 'description', 'image', 'sort_order', 'is_active']));

        return ApiResponse::success(['id' => $category->id], 'Category updated.');
    }

    public function destroyCategory(int $restaurantId, int $categoryId): JsonResponse
    {
        $category = MenuCategory::where('restaurant_id', $restaurantId)->findOrFail($categoryId);

        // Remove items in this category and its sub-categories, then the categories.
        $categoryIds = collect([$category->id])->merge($category->subcategories()->pluck('id'));
        MenuItem::whereIn('category_id', $categoryIds)->delete();
        MenuCategory::where('parent_id', $category->id)->delete();
        $category->delete();

        return ApiResponse::success(null, 'Category deleted with its items.');
    }

    public function storeItem(Request $request, int $restaurantId): JsonResponse
    {
        $data = $this->validateItem($request, true);

        $item = MenuItem::create([
            'restaurant_id' => $restaurantId,
            'category_id' => $data['category_id'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'image' => $data['image'] ?? null,
            'base_price' => $data['price'],
            'discount_price' => $data['discount_price'] ?? null,
            'food_type' => ($data['is_veg'] ?? false) ? 'VEG' : 'NON_VEG',
            'is_available' => $data['is_available'] ?? true,
            'preparation_time_minutes' => $data['prep_time'] ?? null,
            'short_code' => $data['short_code'] ?? null,
        ]);

        return ApiResponse::success($this->itemArray($item), 'Menu item created.', 201);
    }

    public function updateItem(Request $request, int $restaurantId, int $itemId): JsonResponse
    {
        $item = MenuItem::where('restaurant_id', $restaurantId)->findOrFail($itemId);
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

    public function destroyItem(int $restaurantId, int $itemId): JsonResponse
    {
        MenuItem::where('restaurant_id', $restaurantId)->findOrFail($itemId)->delete();

        return ApiResponse::success(null, 'Menu item deleted.');
    }

    public function toggleItemAvailability(Request $request, int $restaurantId, int $itemId): JsonResponse
    {
        $item = MenuItem::where('restaurant_id', $restaurantId)->findOrFail($itemId);
        $item->update(['is_available' => (bool) $request->input('is_available', ! $item->is_available)]);

        return ApiResponse::success(
            ['id' => $item->id, 'is_available' => (bool) $item->is_available],
            'Availability updated.'
        );
    }

    /** Flexible image upload — accepts any common image, up to 10 MB. */
    public function uploadImage(Request $request, int $restaurantId): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'max:10240'],
        ]);

        $path = $request->file('image')->store('menu/'.$restaurantId, 'public');

        return ApiResponse::success(
            ['url' => asset('storage/'.$path)],
            'Image uploaded successfully.',
            201
        );
    }

    protected function validateItem(Request $request, bool $isCreate): array
    {
        return $request->validate([
            'name' => [$isCreate ? 'required' : 'sometimes', 'string', 'max:150'],
            'category_id' => [$isCreate ? 'required' : 'sometimes', 'integer', 'exists:menu_categories,id'],
            'price' => [$isCreate ? 'required' : 'sometimes', 'numeric', 'min:0'],
            'discount_price' => ['nullable', 'numeric', 'min:0'],
            'is_veg' => ['nullable', 'boolean'],
            'is_available' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string'],
            'prep_time' => ['nullable', 'integer', 'min:0'],
            'short_code' => ['nullable', 'string', 'max:50'],
        ]);
    }

    protected function itemArray(MenuItem $item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'description' => $item->description,
            'image' => $this->url($item->image),
            'is_veg' => $item->food_type?->value === 'VEG',
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
