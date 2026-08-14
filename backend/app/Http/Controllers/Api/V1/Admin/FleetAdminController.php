<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Services\TelemetryService;
use Illuminate\Http\JsonResponse;

class FleetAdminController extends Controller
{
    public function __construct(
        protected TelemetryService $telemetryService
    ) {}

    public function liveMap(): JsonResponse
    {
        $fleet = $this->telemetryService->getAdminLiveFleet();

        return ApiResponse::success(
            $fleet,
            'Live fleet map coordinates retrieved.'
        );
    }
}
