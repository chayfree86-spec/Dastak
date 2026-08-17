<?php

namespace App\Http\Controllers\Api\V1\Delivery;

use App\Http\Controllers\Controller;
use App\Http\Requests\Delivery\StreamLocationRequest;
use App\Http\Resources\ApiResponse;
use App\Services\TelemetryService;
use Illuminate\Http\JsonResponse;

class DeliveryLocationController extends Controller
{
    public function __construct(
        protected TelemetryService $telemetryService
    ) {}

    public function streamLocation(StreamLocationRequest $request): JsonResponse
    {
        $location = $this->telemetryService->recordRiderLocation(
            rider: $request->user(),
            latitude: (float) $request->input('latitude'),
            longitude: (float) $request->input('longitude'),
            heading: $request->filled('heading') ? (float) $request->input('heading') : null,
            speed: $request->filled('speed') ? (float) $request->input('speed') : null,
            activeOrderId: $request->filled('active_order_id') ? (int) $request->input('active_order_id') : null
        );

        return ApiResponse::success([
            'recorded_at' => $location->recorded_at->toIso8601String(),
            'latitude' => (float) $location->latitude,
            'longitude' => (float) $location->longitude,
        ], 'Rider GPS telemetry location streamed successfully.');
    }
}
