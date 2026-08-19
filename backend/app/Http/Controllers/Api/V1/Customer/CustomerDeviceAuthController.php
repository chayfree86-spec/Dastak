<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\UserResource;
use App\Services\DeviceSessionAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerDeviceAuthController extends Controller
{
    public function __construct(
        protected DeviceSessionAuthService $deviceAuthService
    ) {}

    public function start(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mobile' => ['required', 'string', 'min:10', 'max:15'],
            'device_id' => ['required', 'string', 'min:8', 'max:128'],
            'device_name' => ['nullable', 'string', 'max:150'],
            'device_platform' => ['nullable', 'string', 'in:mobile,desktop,web_pc'],
        ]);

        $result = $this->deviceAuthService->startVerification(
            mobile: $validated['mobile'],
            deviceId: $validated['device_id'],
            appType: 'customer',
            deviceName: $validated['device_name'] ?? 'Customer Device',
            devicePlatform: $validated['device_platform'] ?? 'mobile'
        );

        if (! empty($result['session_active_elsewhere'])) {
            return ApiResponse::error(
                $result['message'],
                409,
                [
                    'session_active_elsewhere' => true,
                    'active_device_name' => $result['active_device_name'],
                    'instructions' => $result['instructions'],
                ]
            );
        }

        return ApiResponse::success($result, $result['message']);
    }

    public function resendOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => ['required', 'string'],
            'device_id' => ['required', 'string'],
        ]);

        $result = $this->deviceAuthService->resendOtp(
            sessionPublicId: $validated['session_id'],
            deviceId: $validated['device_id']
        );

        return ApiResponse::success($result, $result['message']);
    }

    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => ['required', 'string'],
            'otp' => ['required', 'string', 'min:4', 'max:8'],
            'device_id' => ['required', 'string'],
            'name' => ['nullable', 'string', 'max:100'],
            'device_name' => ['nullable', 'string', 'max:150'],
        ]);

        $result = $this->deviceAuthService->verifyOtp(
            sessionPublicId: $validated['session_id'],
            otp: $validated['otp'],
            deviceId: $validated['device_id'],
            name: $validated['name'] ?? null,
            deviceName: $validated['device_name'] ?? 'Customer App'
        );

        return ApiResponse::success([
            'token' => $result['token'],
            'session_token' => $result['session_token'],
            'user' => new UserResource($result['user']),
            'is_new_user' => $result['is_new_user'],
        ], $result['message']);
    }

    public function session(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_token' => ['required', 'string'],
            'device_id' => ['required', 'string'],
        ]);

        $result = $this->deviceAuthService->validateSession(
            rawToken: $validated['session_token'],
            deviceId: $validated['device_id'],
            appType: 'customer'
        );

        return ApiResponse::success([
            'user' => new UserResource($result['user']),
            'device_name' => $result['device_name'],
        ], 'Session is valid.');
    }

    public function changeDevice(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'device_id' => ['required', 'string'],
        ]);

        $this->deviceAuthService->changeDevice(
            user: $request->user(),
            deviceId: $validated['device_id'],
            appType: 'customer',
            reason: 'CUSTOMER_DEVICE_CHANGED'
        );

        return ApiResponse::success(null, 'Current device session removed. You can now verify on this or a new device.');
    }

    public function logout(Request $request): JsonResponse
    {
        $deviceId = $request->input('device_id') ?? 'unknown';

        $this->deviceAuthService->changeDevice(
            user: $request->user(),
            deviceId: $deviceId,
            appType: 'customer',
            reason: 'CUSTOMER_LOGOUT'
        );

        return ApiResponse::success(null, 'Successfully signed out.');
    }
}
