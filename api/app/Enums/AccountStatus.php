<?php

namespace App\Enums;

enum AccountStatus: string
{
    case ACTIVE = 'ACTIVE';
    case PENDING = 'PENDING';
    case SUSPENDED = 'SUSPENDED';
    case BLOCKED = 'BLOCKED';

    public function isAllowedToAuthenticate(): bool
    {
        return $this === self::ACTIVE;
    }
}
