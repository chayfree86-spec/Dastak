<?php

namespace App\Enums;

enum PayoutMethod: string
{
    case BANK_TRANSFER = 'BANK_TRANSFER';
    case UPI = 'UPI';
    case MANUAL = 'MANUAL';
}
