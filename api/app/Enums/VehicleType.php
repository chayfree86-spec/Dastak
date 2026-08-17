<?php

namespace App\Enums;

enum VehicleType: string
{
    case MOTORCYCLE = 'MOTORCYCLE';
    case SCOOTER = 'SCOOTER';
    case EV_SCOOTER = 'EV_SCOOTER';
    case BICYCLE = 'BICYCLE';

    public function label(): string
    {
        return match ($this) {
            self::MOTORCYCLE => 'Motorcycle',
            self::SCOOTER => 'Scooter',
            self::EV_SCOOTER => 'Electric Scooter',
            self::BICYCLE => 'Bicycle',
        };
    }
}
