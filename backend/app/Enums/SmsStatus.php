<?php

namespace App\Enums;

enum SmsStatus: string
{
    case SENT = 'SENT';
    case DELIVERED = 'DELIVERED';
    case FAILED = 'FAILED';
}
