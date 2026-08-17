<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewAdminController extends Controller
{
    public function __construct(
        protected ReviewService $reviewService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Review::with(['restaurant', 'deliveryBoy', 'customer', 'order'])->latest('id');

        if ($request->filled('restaurant_id')) {
            $query->where('restaurant_id', $request->input('restaurant_id'));
        }

        if ($request->filled('delivery_boy_id')) {
            $query->where('delivery_boy_id', $request->input('delivery_boy_id'));
        }

        $reviews = $query->paginate((int) $request->input('per_page', 20));

        return ApiResponse::paginated(
            paginator: $reviews,
            resourceClass: ReviewResource::class,
            message: 'All platform reviews retrieved.'
        );
    }

    public function toggleVisibility(Request $request, int $id): JsonResponse
    {
        $review = Review::findOrFail($id);
        $review->is_visible = ! $review->is_visible;
        $review->save();

        // Recalculate ratings after visibility toggle
        $this->reviewService->recalculateRatings($review->restaurant_id, $review->delivery_boy_id);

        return ApiResponse::success(
            new ReviewResource($review),
            $review->is_visible ? 'Review is now visible.' : 'Review hidden by moderator.'
        );
    }
}
