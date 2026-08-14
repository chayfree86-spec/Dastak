<?php

namespace App\Enums;

enum AddressType: string
{
    case HOME = 'HOME';
    case WORK = 'WORK';
    case OTHER = 'OTHER';

    public function label(): string
    {
        return match ($this) {
            self::HOME => 'Home',
            self::WORK => 'Work / Office',
            self::OTHER => 'Other',
        };
    }
}
