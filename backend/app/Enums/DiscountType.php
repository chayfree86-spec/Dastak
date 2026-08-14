<?php

namespace App\Enums;

enum DiscountType: string
{
    case PERCENTAGE = 'PERCENTAGE';
    case FIXED = 'FIXED';

    public function label(): string
    {
        return match ($this) {
            self::PERCENTAGE => 'Percentage Discount (%)',
            self::FIXED => 'Flat Amount Discount (₹)',
        };
    }
}
