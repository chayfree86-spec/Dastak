<?php

namespace App\Http\Resources;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    public static function success(mixed $data = null, string $message = 'Success', int $statusCode = 200, array $meta = []): JsonResponse
    {
        $payload = [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];

        if (! empty($meta)) {
            $payload['meta'] = $meta;
        }

        return response()->json($payload, $statusCode);
    }

    public static function error(string $message = 'Error', mixed $errors = null, mixed $statusCode = 400): JsonResponse
    {
        $finalStatus = 400;
        $finalErrors = null;

        if (is_int($errors)) {
            $finalStatus = $errors;
            $finalErrors = is_array($statusCode) || is_string($statusCode) ? $statusCode : null;
        } else {
            $finalErrors = $errors;
            $finalStatus = is_int($statusCode) ? $statusCode : 400;
        }

        $payload = [
            'success' => false,
            'message' => $message,
            'errors' => $finalErrors,
        ];

        return response()->json($payload, $finalStatus);
    }

    public static function paginated(mixed $paginator, mixed $resourceClass, string $message = 'Success', array $extraMeta = []): JsonResponse
    {
        $items = $resourceClass::collection($paginator->items());

        $meta = [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];

        if (! empty($extraMeta)) {
            $meta = array_merge($meta, $extraMeta);
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $items,
            'meta' => $meta,
        ]);
    }
}
