<?php

namespace App\Enums;

enum UserRole: string
{
    case SUPER_ADMIN = 'super_admin';
    case OPERATIONS_ADMIN = 'operations_admin';
    case FINANCE_ADMIN = 'finance_admin';
    case SUPPORT_ADMIN = 'support_admin';
    case RESTAURANT = 'restaurant_owner';
    case DELIVERY_BOY = 'delivery_boy';
    case CUSTOMER = 'customer';

    public function label(): string
    {
        return match ($this) {
            self::SUPER_ADMIN => 'Super Administrator',
            self::OPERATIONS_ADMIN => 'Operations Manager',
            self::FINANCE_ADMIN => 'Finance Manager',
            self::SUPPORT_ADMIN => 'Support Executive',
            self::RESTAURANT => 'Restaurant Partner',
            self::DELIVERY_BOY => 'Delivery Rider',
            self::CUSTOMER => 'Customer',
        };
    }
}
