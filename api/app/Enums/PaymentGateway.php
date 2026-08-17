<?php

namespace App\Enums;

enum PaymentGateway: string
{
    case RAZORPAY = 'RAZORPAY';
    case CASH = 'CASH';
    case WALLET = 'WALLET';
}
