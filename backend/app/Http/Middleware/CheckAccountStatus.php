<?php

namespace App\Http\Middleware;

use App\Http\Resources\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAccountStatus
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->isBlocked()) {
            return ApiResponse::error('Access denied: Your account is suspended or blocked.', null, 403);
        }

        return $next($request);
    }
}
