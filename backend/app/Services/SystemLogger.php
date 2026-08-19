<?php

namespace App\Services;

use App\Models\SystemLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SystemLogger
{
    /**
     * Sanitizes sensitive fields from log metadata
     */
    public static function sanitizeMetadata(?array $data): ?array
    {
        if (! $data) {
            return null;
        }

        $sensitiveKeys = [
            'password', 'password_confirmation', 'pin', 'login_pin', 'token', 'access_token',
            'refresh_token', 'secret', 'key', 'api_key', 'authorization', 'bearer', 'cvv',
            'card_number', 'card', 'bank_account_number', 'private_key', 'credit_card',
        ];

        array_walk_recursive($data, function (&$value, $key) use ($sensitiveKeys) {
            $normalizedKey = strtolower((string) $key);
            foreach ($sensitiveKeys as $pattern) {
                if (str_contains($normalizedKey, $pattern)) {
                    $value = '******** (redacted)';
                    break;
                }
            }
        });

        return $data;
    }

    /**
     * Records a system log entry in the database
     */
    public static function log(
        string $level,
        string $category,
        string $event,
        string $description,
        array $params = []
    ): ?SystemLog {
        try {
            $requestId = $params['request_id'] ?? request()->header('X-Request-ID') ?? session('request_id');
            if (! $requestId) {
                $requestId = 'REQ-' . date('Ymd') . '-' . strtoupper(Str::random(6));
            }

            $user = request()->user();
            $actorType = $params['actor_type'] ?? ($user ? strtoupper($user->roles()->first()?->slug ?? 'USER') : 'SYSTEM');
            $actorId = $params['actor_id'] ?? $user?->id;
            $actorName = $params['actor_name'] ?? $user?->name ?? 'System Process';

            return SystemLog::create([
                'level' => strtoupper($level),
                'category' => strtoupper($category),
                'event' => strtoupper($event),
                'description' => $description,
                'actor_type' => $actorType,
                'actor_id' => $actorId,
                'actor_name' => $actorName,
                'reference_type' => $params['reference_type'] ?? null,
                'reference_id' => $params['reference_id'] ?? null,
                'request_id' => $requestId,
                'endpoint' => $params['endpoint'] ?? request()->path(),
                'http_method' => $params['http_method'] ?? request()->method(),
                'http_status' => $params['http_status'] ?? null,
                'response_time_ms' => $params['response_time_ms'] ?? null,
                'error_code' => $params['error_code'] ?? null,
                'metadata' => self::sanitizeMetadata($params['metadata'] ?? null),
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent() ? Str::limit(request()->userAgent(), 250) : null,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Failsafe: if database write fails, log to standard Laravel log
            Log::error("SystemLogger failed to persist: " . $e->getMessage(), [
                'event' => $event,
                'level' => $level,
            ]);
            return null;
        }
    }

    public static function info(string $category, string $event, string $description, array $params = []): ?SystemLog
    {
        return self::log('INFO', $category, $event, $description, $params);
    }

    public static function success(string $category, string $event, string $description, array $params = []): ?SystemLog
    {
        return self::log('SUCCESS', $category, $event, $description, $params);
    }

    public static function warning(string $category, string $event, string $description, array $params = []): ?SystemLog
    {
        return self::log('WARNING', $category, $event, $description, $params);
    }

    public static function error(string $category, string $event, string $description, array $params = []): ?SystemLog
    {
        return self::log('ERROR', $category, $event, $description, $params);
    }

    public static function critical(string $category, string $event, string $description, array $params = []): ?SystemLog
    {
        return self::log('CRITICAL', $category, $event, $description, $params);
    }

    public static function security(string $category, string $event, string $description, array $params = []): ?SystemLog
    {
        return self::log('SECURITY', $category, $event, $description, $params);
    }
}
