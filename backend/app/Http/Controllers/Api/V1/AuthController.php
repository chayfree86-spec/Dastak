<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            identifier: $request->input('identifier'),
            password: $request->input('password'),
            deviceName: $request->input('device_name', 'Web Application')
        );

        return ApiResponse::success([
            'token' => $result['token'],
            'user' => new UserResource($result['user']),
        ], 'Login successful.');
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'mobile' => ['required', 'string', 'min:10', 'max:15'],
            'email' => ['nullable', 'email', 'max:100'],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        $result = $this->authService->registerCustomer($validated);

        return ApiResponse::success([
            'token' => $result['token'],
            'user' => new UserResource($result['user']),
        ], 'Registration successful.', 201);
    }

    public function sendOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mobile' => ['required', 'string', 'min:10', 'max:15'],
        ]);

        $result = $this->authService->sendOtp($validated['mobile']);

        return ApiResponse::success($result, $result['message']);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mobile' => ['required', 'string', 'min:10', 'max:15'],
            'otp' => ['required', 'string', 'max:6'],
            'name' => ['nullable', 'string', 'max:100'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        $result = $this->authService->verifyOtp(
            mobile: $validated['mobile'],
            otp: $validated['otp'],
            name: $validated['name'] ?? null,
            deviceName: $validated['device_name'] ?? 'Customer App'
        );

        return ApiResponse::success([
            'token' => $result['token'],
            'user' => new UserResource($result['user']),
            'is_new_user' => $result['is_new_user'],
        ], $result['is_new_user'] ? 'Account verified! Please complete your delivery profile.' : 'Welcome back! Signed in successfully.');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles.permissions');

        return ApiResponse::success(
            new UserResource($user),
            'Profile retrieved successfully.'
        );
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return ApiResponse::success(null, 'Successfully logged out.');
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $this->authService->changePassword(
            user: $request->user(),
            currentPassword: $request->input('current_password'),
            newPassword: $request->input('new_password')
        );

        return ApiResponse::success(null, 'Password updated successfully. Please log in again with your new password.');
    }
}
