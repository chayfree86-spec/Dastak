<?php

namespace App\Http\Middleware;

use App\Http\Resources\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user) {
            return ApiResponse::error('Unauthenticated.', null, 401);
        }

        if (! $user->hasPermission($permission)) {
            return ApiResponse::error('Forbidden: You do not have permission to perform this action.', null, 403);
        }

        return $next($request);
    }
}
