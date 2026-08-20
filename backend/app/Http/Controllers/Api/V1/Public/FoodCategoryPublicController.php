<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Models\FoodCategory;
use Illuminate\Http\JsonResponse;

class FoodCategoryPublicController extends Controller
{
    /** Global food-category chips shown on the customer home screen — DB driven. */
    public function index(): JsonResponse
    {
        $categories = FoodCategory::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->slug,
                'name' => $c->name,
                'image' => $c->image,
                'query' => $c->search_query ?: $c->slug,
            ])
            ->values();

        return ApiResponse::success($categories, 'Food categories retrieved.');
    }
}
