<?php

namespace App\Enums;

enum PaymentMode: string
{
    case COD = 'COD';
    case ONLINE = 'ONLINE';
    case WALLET = 'WALLET';
}
