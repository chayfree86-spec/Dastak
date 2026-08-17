<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsAdminController extends Controller
{
    public function __construct(
        protected AnalyticsService $analyticsService
    ) {}

    public function dashboard(Request $request): JsonResponse
    {
        $days = (int) $request->input('days', 30);

        $summary = $this->analyticsService->getAdminDashboardSummary();
        $chart = $this->analyticsService->getAdminSalesChart($days);
        $topEntities = $this->analyticsService->getTopPerformingEntities();

        return ApiResponse::success([
            'summary' => $summary,
            'sales_chart' => $chart,
            'top_performers' => $topEntities,
        ], 'Admin analytics dashboard data retrieved.');
    }
}
