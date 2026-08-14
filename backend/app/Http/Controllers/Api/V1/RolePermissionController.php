<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\PermissionResource;
use App\Http\Resources\RoleResource;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;

class RolePermissionController extends Controller
{
    public function getRoles(): JsonResponse
    {
        $roles = Role::with('permissions')->get();

        return ApiResponse::success(
            RoleResource::collection($roles),
            'Roles retrieved successfully.'
        );
    }

    public function getPermissions(): JsonResponse
    {
        $permissions = Permission::all();

        return ApiResponse::success(
            PermissionResource::collection($permissions),
            'Permissions retrieved successfully.'
        );
    }
}
