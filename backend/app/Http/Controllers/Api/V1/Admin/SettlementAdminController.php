<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GenerateSettlementRequest;
use App\Http\Requests\Admin\ProcessPayoutRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\RestaurantSettlementResource;
use App\Models\RestaurantSettlement;
use App\Services\SettlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettlementAdminController extends Controller
{
    public function __construct(
        protected SettlementService $settlementService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = RestaurantSettlement::with(['restaurant', 'processedByAdmin'])->latest('id');

        if ($request->filled('restaurant_id')) {
            $query->where('restaurant_id', $request->input('restaurant_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $settlements = $query->paginate((int) $request->input('per_page', 20));

        return ApiResponse::paginated(
            paginator: $settlements,
            resourceClass: RestaurantSettlementResource::class,
            message: 'Restaurant settlements retrieved.'
        );
    }

    public function generate(GenerateSettlementRequest $request): JsonResponse
    {
        $settlement = $this->settlementService->generateSettlement(
            restaurantId: (int) $request->input('restaurant_id'),
            startDate: $request->input('period_start'),
            endDate: $request->input('period_end')
        );

        return ApiResponse::success(
            new RestaurantSettlementResource($settlement),
            'Settlement batch generated successfully.',
            201
        );
    }

    public function processPayout(ProcessPayoutRequest $request, int $id): JsonResponse
    {
        $settlement = RestaurantSettlement::findOrFail($id);

        $settlement = $this->settlementService->processPayout(
            settlement: $settlement,
            admin: $request->user(),
            payoutMethod: $request->input('payout_method'),
            reference: $request->input('payout_reference'),
            notes: $request->input('notes')
        );

        return ApiResponse::success(
            new RestaurantSettlementResource($settlement),
            'Merchant settlement payout processed successfully.'
        );
    }
}
