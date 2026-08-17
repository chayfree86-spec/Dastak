<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notification\RegisterDeviceTokenRequest;
use App\Http\Resources\ApiResponse;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceTokenController extends Controller
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    public function store(RegisterDeviceTokenRequest $request): JsonResponse
    {
        $deviceToken = $this->notificationService->registerDeviceToken(
            user: $request->user(),
            token: $request->input('fcm_token'),
            deviceType: $request->input('device_type', 'ANDROID')
        );

        return ApiResponse::success([
            'device_type' => $deviceToken->device_type->value,
            'is_active' => $deviceToken->is_active,
            'registered_at' => $deviceToken->updated_at->toIso8601String(),
        ], 'Device FCM push token registered successfully.');
    }

    public function destroy(Request $request): JsonResponse
    {
        $token = $request->input('fcm_token');
        if ($token) {
            $this->notificationService->removeDeviceToken($request->user(), $token);
        }

        return ApiResponse::success(null, 'Device token unregistered.');
    }
}
