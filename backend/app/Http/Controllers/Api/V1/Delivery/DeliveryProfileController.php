<?php

namespace App\Http\Controllers\Api\V1\Delivery;

use App\Http\Controllers\Controller;
use App\Http\Requests\Delivery\UpdateDeliveryProfileRequest;
use App\Http\Requests\Delivery\UpdateDutyStatusRequest;
use App\Http\Requests\Delivery\UpdateLocationRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\DeliveryBoyProfileResource;
use App\Services\DeliveryProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryProfileController extends Controller
{
    public function __construct(
        protected DeliveryProfileService $deliveryService
    ) {}

    public function getProfile(Request $request): JsonResponse
    {
        $profile = $this->deliveryService->getProfile($request->user());

        return ApiResponse::success(
            new DeliveryBoyProfileResource($profile),
            'Delivery profile retrieved successfully.'
        );
    }

    public function updateProfile(UpdateDeliveryProfileRequest $request): JsonResponse
    {
        $profile = $this->deliveryService->updateProfile($request->user(), $request->validated());

        return ApiResponse::success(
            new DeliveryBoyProfileResource($profile),
            'Delivery profile updated successfully.'
        );
    }

    public function toggleDutyStatus(UpdateDutyStatusRequest $request): JsonResponse
    {
        $profile = $this->deliveryService->toggleDutyStatus($request->user(), (bool) $request->input('is_online'));

        $statusLabel = $profile->is_online ? 'online' : 'offline';

        return ApiResponse::success(
            new DeliveryBoyProfileResource($profile),
            "Rider status updated to {$statusLabel}."
        );
    }

    public function updateLocation(UpdateLocationRequest $request): JsonResponse
    {
        $profile = $this->deliveryService->updateLocation(
            user: $request->user(),
            latitude: (float) $request->input('latitude'),
            longitude: (float) $request->input('longitude')
        );

        return ApiResponse::success(
            new DeliveryBoyProfileResource($profile),
            'GPS coordinates updated successfully.'
        );
    }
}
