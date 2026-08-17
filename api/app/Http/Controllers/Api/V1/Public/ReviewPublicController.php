<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\ReviewResource;
use App\Models\Restaurant;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewPublicController extends Controller
{
    public function getRestaurantReviews(Request $request, string $slug): JsonResponse
    {
        $restaurant = Restaurant::where('slug', $slug)->firstOrFail();

        $reviews = Review::where('restaurant_id', $restaurant->id)
            ->where('is_visible', true)
            ->with(['customer', 'order'])
            ->latest('id')
            ->paginate((int) $request->input('per_page', 15));

        return ApiResponse::paginated(
            paginator: $reviews,
            resourceClass: ReviewResource::class,
            message: 'Restaurant customer reviews retrieved.'
        );
    }
}
