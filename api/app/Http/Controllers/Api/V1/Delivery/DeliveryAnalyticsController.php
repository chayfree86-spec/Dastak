<?php

namespace App\Http\Controllers\Api\V1\Delivery;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryAnalyticsController extends Controller
{
    public function __construct(
        protected AnalyticsService $analyticsService
    ) {}

    public function summary(Request $request): JsonResponse
    {
        $summary = $this->analyticsService->getRiderSummary($request->user());

        return ApiResponse::success(
            $summary,
            'Rider earnings and delivery summary retrieved.'
        );
    }
}
