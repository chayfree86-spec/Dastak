<?php

namespace App\Enums;

enum RefundStatus: string
{
    case PENDING = 'PENDING';
    case PROCESSED = 'PROCESSED';
    case FAILED = 'FAILED';
}
