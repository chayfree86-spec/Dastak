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
