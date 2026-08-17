<?php

namespace App\Http\Middleware;

use App\Http\Resources\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return ApiResponse::error('Unauthenticated.', null, 401);
        }

        if (! $user->hasRole($roles)) {
            return ApiResponse::error('Unauthorized: You do not have the required role to perform this action.', null, 403);
        }

        return $next($request);
    }
}
