<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\AccountStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignRoleRequest;
use App\Http\Requests\Admin\UpdateUserStatusRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    public function __construct(
        protected UserService $userService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'role', 'status']);
        $perPage = (int) $request->input('per_page', 15);

        $paginator = $this->userService->listUsers($filters, $perPage);

        return ApiResponse::paginated(
            paginator: $paginator,
            resourceClass: UserResource::class,
            message: 'Users retrieved successfully.'
        );
    }

    public function show(int $id): JsonResponse
    {
        $user = $this->userService->getUserDetails($id);

        return ApiResponse::success(
            new UserResource($user),
            'User details retrieved successfully.'
        );
    }

    public function updateStatus(UpdateUserStatusRequest $request, User $user): JsonResponse
    {
        $status = AccountStatus::from($request->input('status'));
        $reason = $request->input('reason');

        $updatedUser = $this->userService->updateUserStatus($user, $status, $reason);

        return ApiResponse::success(
            new UserResource($updatedUser),
            "User status updated to {$status->value} successfully."
        );
    }

    public function assignRoles(AssignRoleRequest $request, User $user): JsonResponse
    {
        $updatedUser = $this->userService->assignRoles($user, $request->input('roles'));

        return ApiResponse::success(
            new UserResource($updatedUser),
            'User roles updated successfully.'
        );
    }
}
