<?php

namespace App\Http\Middleware;

use App\Services\SystemLogger;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RequestTracingMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        // Assign or propagate unique Request ID
        $requestId = $request->header('X-Request-ID');
        if (! $requestId) {
            $requestId = 'REQ-' . date('Ymd') . '-' . strtoupper(Str::random(6));
            $request->headers->set('X-Request-ID', $requestId);
        }

        $response = $next($request);

        $durationMs = (int) round((microtime(true) - $startTime) * 1000);
        $status = $response->getStatusCode();
        $path = $request->path();

        // Skip logging health checks or system log polling itself to avoid recursion
        $isSystemLogApi = str_contains($path, 'admin/system-logs');

        if (! $isSystemLogApi) {
            // 1. Security Alert: 401 Unauthorized / 403 Forbidden
            if ($status === 401 || $status === 403) {
                SystemLogger::security(
                    'SECURITY',
                    'SECURITY_UNAUTHORIZED_ACCESS',
                    "Unauthorized access attempt to [{$request->method()}] /{$path}",
                    [
                        'request_id' => $requestId,
                        'endpoint' => "/{$path}",
                        'http_method' => $request->method(),
                        'http_status' => $status,
                        'response_time_ms' => $durationMs,
                    ]
                );
            }

            // 2. Server Error Alert: 500 Internal Error
            if ($status >= 500) {
                SystemLogger::critical(
                    'API',
                    'API_SERVER_ERROR',
                    "Server error {$status} encountered on [{$request->method()}] /{$path}",
                    [
                        'request_id' => $requestId,
                        'endpoint' => "/{$path}",
                        'http_method' => $request->method(),
                        'http_status' => $status,
                        'response_time_ms' => $durationMs,
                    ]
                );
            }

            // 3. Slow API Warning (> 2000ms)
            if ($durationMs > 2000) {
                SystemLogger::warning(
                    'API',
                    'API_SLOW_RESPONSE',
                    "Slow API execution detected ({$durationMs}ms) on [{$request->method()}] /{$path}",
                    [
                        'request_id' => $requestId,
                        'endpoint' => "/{$path}",
                        'http_method' => $request->method(),
                        'http_status' => $status,
                        'response_time_ms' => $durationMs,
                    ]
                );
            }
        }

        $response->headers->set('X-Request-ID', $requestId);
        $response->headers->set('X-Response-Time', "{$durationMs}ms");

        return $response;
    }
}
