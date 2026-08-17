<?php

namespace App\Enums;

enum TicketCategory: string
{
    case ORDER_ISSUE = 'ORDER_ISSUE';
    case PAYMENT_ISSUE = 'PAYMENT_ISSUE';
    case DELIVERY_DELAY = 'DELIVERY_DELAY';
    case FOOD_QUALITY = 'FOOD_QUALITY';
    case ACCOUNT_ISSUE = 'ACCOUNT_ISSUE';
    case OTHER = 'OTHER';
}
