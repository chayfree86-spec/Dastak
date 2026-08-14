<?php

namespace App\Http\Controllers\Api\V1\Partner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\ReplyReviewRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\ReviewResource;
use App\Models\Restaurant;
use App\Models\Review;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PartnerReviewController extends Controller
{
    public function __construct(
        protected ReviewService $reviewService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $restaurant = Restaurant::where('owner_id', $request->user()->id)->firstOrFail();

        $reviews = Review::where('restaurant_id', $restaurant->id)
            ->with(['customer', 'order'])
            ->latest('id')
            ->paginate((int) $request->input('per_page', 15));

        return ApiResponse::paginated(
            paginator: $reviews,
            resourceClass: ReviewResource::class,
            message: 'Restaurant reviews retrieved.'
        );
    }

    public function reply(ReplyReviewRequest $request, int $id): JsonResponse
    {
        $restaurant = Restaurant::where('owner_id', $request->user()->id)->firstOrFail();

        $review = Review::where('restaurant_id', $restaurant->id)->findOrFail($id);

        $review = $this->reviewService->replyToReview($review, $request->input('reply'));

        return ApiResponse::success(
            new ReviewResource($review),
            'Reply posted to customer review.'
        );
    }
}
