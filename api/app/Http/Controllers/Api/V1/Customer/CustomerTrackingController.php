<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Models\Order;
use App\Services\TelemetryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerTrackingController extends Controller
{
    public function __construct(
        protected TelemetryService $telemetryService
    ) {}

    public function liveTracking(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::where('customer_id', $request->user()->id)
            ->where('order_number', $orderNumber)
            ->with(['restaurant', 'deliveryBoy.deliveryProfile'])
            ->firstOrFail();

        $trackingData = $this->telemetryService->getOrderLiveTracking($order);

        return ApiResponse::success(
            $trackingData,
            'Live order tracking coordinates retrieved.'
        );
    }
}
