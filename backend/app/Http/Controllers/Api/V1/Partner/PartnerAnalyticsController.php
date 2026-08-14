<?php

namespace App\Http\Controllers\Api\V1\Partner;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\RestaurantSettlementResource;
use App\Models\Restaurant;
use App\Models\RestaurantSettlement;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PartnerAnalyticsController extends Controller
{
    public function __construct(
        protected AnalyticsService $analyticsService
    ) {}

    public function dashboard(Request $request): JsonResponse
    {
        $restaurant = Restaurant::where('owner_id', $request->user()->id)->firstOrFail();

        $summary = $this->analyticsService->getPartnerDashboardSummary($restaurant);

        return ApiResponse::success(
            $summary,
            'Partner restaurant dashboard statistics retrieved.'
        );
    }

    public function settlements(Request $request): JsonResponse
    {
        $restaurant = Restaurant::where('owner_id', $request->user()->id)->firstOrFail();

        $settlements = RestaurantSettlement::where('restaurant_id', $restaurant->id)
            ->latest('id')
            ->paginate((int) $request->input('per_page', 15));

        return ApiResponse::paginated(
            paginator: $settlements,
            resourceClass: RestaurantSettlementResource::class,
            message: 'Restaurant payout settlement history.'
        );
    }
}
