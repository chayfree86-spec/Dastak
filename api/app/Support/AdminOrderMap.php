<?php

namespace App\Support;

use App\Enums\OrderStatus;
use App\Enums\PaymentMode;

/**
 * Translates order vocabulary between the admin frontend and the backend enums.
 *
 * The React admin panel uses a slightly different set of status / payment tokens
 * than the backend OrderStatus / PaymentMode enums. All admin order endpoints run
 * their in/out values through this map so the UI receives exactly what it expects.
 */
class AdminOrderMap
{
    /** Backend OrderStatus value => frontend status token (reads). */
    public const STATUS_TO_FRONTEND = [
        'PENDING' => 'NEW',
        'CONFIRMED' => 'ACCEPTED',
        'PREPARING' => 'PREPARING',
        'READY_FOR_PICKUP' => 'READY',
        'OUT_FOR_DELIVERY' => 'OUT_FOR_DELIVERY',
        'DELIVERED' => 'DELIVERED',
        'CANCELLED' => 'CANCELLED',
        'REJECTED' => 'REJECTED',
        'FAILED' => 'CANCELLED',
        'REFUNDED' => 'CANCELLED',
    ];

    /** Frontend status token => backend OrderStatus value (writes / filters). */
    public const STATUS_TO_BACKEND = [
        'NEW' => 'PENDING',
        'ACCEPTED' => 'CONFIRMED',
        'PREPARING' => 'PREPARING',
        'READY' => 'READY_FOR_PICKUP',
        // Frontend-only intermediate states collapse onto the nearest backend state.
        'ASSIGNED' => 'OUT_FOR_DELIVERY',
        'PICKED_UP' => 'OUT_FOR_DELIVERY',
        'OUT_FOR_DELIVERY' => 'OUT_FOR_DELIVERY',
        'DELIVERED' => 'DELIVERED',
        'CANCELLED' => 'CANCELLED',
        'REJECTED' => 'REJECTED',
    ];

    public static function statusToFrontend(OrderStatus|string|null $status): ?string
    {
        if ($status === null) {
            return null;
        }
        $value = $status instanceof OrderStatus ? $status->value : (string) $status;

        return self::STATUS_TO_FRONTEND[$value] ?? $value;
    }

    public static function statusToBackend(?string $frontendStatus): ?string
    {
        if ($frontendStatus === null || $frontendStatus === '') {
            return null;
        }

        return self::STATUS_TO_BACKEND[strtoupper($frontendStatus)] ?? null;
    }

    public static function paymentToFrontend(PaymentMode|string|null $mode): ?string
    {
        if ($mode === null) {
            return null;
        }
        $value = $mode instanceof PaymentMode ? $mode->value : (string) $mode;

        return $value === 'COD' ? 'COD' : 'ONLINE_PAYMENT';
    }

    public static function paymentToBackend(?string $frontendPayment): ?string
    {
        if ($frontendPayment === null || $frontendPayment === '') {
            return null;
        }

        return strtoupper($frontendPayment) === 'COD' ? 'COD' : 'ONLINE';
    }
}
