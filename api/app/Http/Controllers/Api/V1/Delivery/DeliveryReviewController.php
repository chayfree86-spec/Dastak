<?php

namespace App\Http\Controllers\Api\V1\Delivery;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $reviews = Review::where('delivery_boy_id', $request->user()->id)
            ->whereNotNull('delivery_rating')
            ->where('is_visible', true)
            ->with(['order', 'customer'])
            ->latest('id')
            ->paginate((int) $request->input('per_page', 15));

        $riderProfile = $request->user()->deliveryProfile;

        return ApiResponse::paginated(
            paginator: $reviews,
            resourceClass: ReviewResource::class,
            message: 'Rider delivery ratings and reviews retrieved.',
            extraMeta: [
                'average_rating' => (float) ($riderProfile?->rating ?? 5.0),
                'total_ratings' => (int) ($riderProfile?->total_ratings ?? 0),
            ]
        );
    }
}
