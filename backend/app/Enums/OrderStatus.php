<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PENDING = 'PENDING';
    case CONFIRMED = 'CONFIRMED';
    case PREPARING = 'PREPARING';
    case READY_FOR_PICKUP = 'READY_FOR_PICKUP';
    case OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY';
    case DELIVERED = 'DELIVERED';
    case CANCELLED = 'CANCELLED';
    case REJECTED = 'REJECTED';
    case FAILED = 'FAILED';
    case REFUNDED = 'REFUNDED';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Order Placed',
            self::CONFIRMED => 'Order Confirmed',
            self::PREPARING => 'Preparing Food',
            self::READY_FOR_PICKUP => 'Ready for Pickup',
            self::OUT_FOR_DELIVERY => 'Out for Delivery',
            self::DELIVERED => 'Delivered',
            self::CANCELLED => 'Cancelled',
            self::REJECTED => 'Rejected by Restaurant',
            self::FAILED => 'Delivery Failed',
            self::REFUNDED => 'Refunded',
        };
    }

    public function isFinal(): bool
    {
        return in_array($this, [self::DELIVERED, self::CANCELLED, self::REJECTED, self::FAILED, self::REFUNDED]);
    }
}
