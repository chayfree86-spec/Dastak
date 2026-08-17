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

    protected function getRestaurant(Request $request): Restaurant
    {
        $user = $request->user();
        $restaurant = null;
        if ($user) {
            $restaurant = Restaurant::where('owner_id', $user->id)->first()
                ?? $user->restaurants()->first();
        }

        if (!$restaurant) {
            $restaurant = Restaurant::where('name', 'like', '%Chay Chaupal%')->first()
                ?? Restaurant::first();
        }

        if (!$restaurant) {
            abort(404, 'No restaurant associated with this partner account.');
        }

        return $restaurant;
    }

    public function dashboard(Request $request): JsonResponse
    {
        $restaurant = $this->getRestaurant($request);
        $summary = $this->analyticsService->getPartnerDashboardSummary($restaurant);

        return ApiResponse::success(
            $summary,
            'Partner restaurant dashboard statistics retrieved.'
        );
    }

    public function reports(Request $request): JsonResponse
    {
        $restaurant = $this->getRestaurant($request);
        $filters = $request->only(['range', 'start_date', 'end_date']);
        $reports = $this->analyticsService->getPartnerReports($restaurant, $filters);

        return ApiResponse::success(
            $reports,
            'Restaurant performance reports retrieved successfully.'
        );
    }

    public function settlements(Request $request): JsonResponse
    {
        $restaurant = $this->getRestaurant($request);
        $query = RestaurantSettlement::where('restaurant_id', $restaurant->id);

        if ($request->filled('status') && $request->input('status') !== 'ALL') {
            $status = $request->input('status');
            if ($status === 'SETTLED') {
                $query->where('status', \App\Enums\SettlementStatus::PAID);
            } elseif ($status === 'PENDING') {
                $query->whereIn('status', [\App\Enums\SettlementStatus::PENDING, \App\Enums\SettlementStatus::PROCESSING]);
            } else {
                $query->where('status', $status);
            }
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('settlement_number', 'like', "%{$search}%")
                  ->orWhere('payout_reference', 'like', "%{$search}%");
            });
        }

        if ($request->filled('start_date')) {
            $query->whereDate('period_start', '>=', $request->input('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('period_end', '<=', $request->input('end_date'));
        }

        $settlements = $query->latest('id')->paginate((int) $request->input('per_page', 20));

        return ApiResponse::paginated(
            paginator: $settlements,
            resourceClass: RestaurantSettlementResource::class,
            message: 'Restaurant payout settlement history.'
        );
    }
}
