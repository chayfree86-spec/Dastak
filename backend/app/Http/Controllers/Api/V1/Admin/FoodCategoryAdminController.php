<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Models\FoodCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin CRUD for the global food-category chips shown on the customer home
 * screen. All data is real (DB), manageable from the admin panel.
 */
class FoodCategoryAdminController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = FoodCategory::orderBy('sort_order')->orderBy('id')->get()->map(fn ($c) => $this->row($c));

        return ApiResponse::success($categories, 'Food categories retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request, true);
        $category = FoodCategory::create($data);

        return ApiResponse::success($this->row($category), 'Food category created.', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = FoodCategory::findOrFail($id);
        $category->update($this->validated($request, false));

        return ApiResponse::success($this->row($category->fresh()), 'Food category updated.');
    }

    public function destroy(int $id): JsonResponse
    {
        FoodCategory::findOrFail($id)->delete();

        return ApiResponse::success(null, 'Food category deleted.');
    }

    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $category = FoodCategory::findOrFail($id);
        $category->update(['is_active' => (bool) $request->input('is_active', ! $category->is_active)]);

        return ApiResponse::success(['id' => $category->id, 'is_active' => (bool) $category->is_active], 'Status updated.');
    }

    /**
     * Bulk reorder category positions / custom sequence.
     * Supports either:
     *   - orders: [{ id: 1, sort_order: 0 }, { id: 2, sort_order: 1 }]
     *   - category_ids: [1, 2, 3, 4] (array index becomes sort_order)
     */
    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'orders' => ['nullable', 'array'],
            'orders.*.id' => ['required_with:orders', 'integer', 'exists:food_categories,id'],
            'orders.*.sort_order' => ['required_with:orders', 'integer'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:food_categories,id'],
        ]);

        \DB::transaction(function () use ($request) {
            if ($request->filled('orders')) {
                foreach ($request->input('orders') as $item) {
                    FoodCategory::where('id', $item['id'])->update(['sort_order' => (int) $item['sort_order']]);
                }
            } elseif ($request->filled('category_ids')) {
                foreach ($request->input('category_ids') as $index => $id) {
                    FoodCategory::where('id', $id)->update(['sort_order' => $index]);
                }
            }
        });

        $categories = FoodCategory::orderBy('sort_order')->orderBy('id')->get()->map(fn ($c) => $this->row($c));

        return ApiResponse::success($categories, 'Food categories reordered successfully.');
    }

    /** Flexible image upload for a category icon (any image, up to 5 MB). */
    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate(['image' => ['required', 'image', 'max:5120']]);
        $path = $request->file('image')->store('food-categories', 'public');

        return ApiResponse::success(['url' => asset('storage/'.$path)], 'Image uploaded.', 201);
    }

    protected function validated(Request $request, bool $isCreate): array
    {
        return $request->validate([
            'name' => [$isCreate ? 'required' : 'sometimes', 'string', 'max:100'],
            'image' => ['nullable', 'string'],
            'search_query' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }

    protected function row(FoodCategory $c): array
    {
        return [
            'id' => $c->id,
            'name' => $c->name,
            'slug' => $c->slug,
            'image' => $c->image,
            'search_query' => $c->search_query,
            'sort_order' => (int) $c->sort_order,
            'is_active' => (bool) $c->is_active,
        ];
    }
}
