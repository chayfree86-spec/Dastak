<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerReviewController extends Controller
{
    public function __construct(
        protected ReviewService $reviewService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $reviews = Review::where('customer_id', $request->user()->id)
            ->with(['restaurant', 'deliveryBoy', 'order'])
            ->latest('id')
            ->paginate((int) $request->input('per_page', 15));

        return ApiResponse::paginated(
            paginator: $reviews,
            resourceClass: ReviewResource::class,
            message: 'My reviews retrieved.'
        );
    }

    public function store(StoreReviewRequest $request): JsonResponse
    {
        $review = $this->reviewService->submitReview(
            customer: $request->user(),
            data: $request->validated()
        );

        return ApiResponse::success(
            new ReviewResource($review),
            'Review submitted successfully. Thank you for your feedback!',
            201
        );
    }
}
