<?php

namespace App\Enums;

enum ActorType: string
{
    case ADMIN = 'ADMIN';
    case RESTAURANT = 'RESTAURANT';
    case DELIVERY_BOY = 'DELIVERY_BOY';
    case CUSTOMER = 'CUSTOMER';
    case SYSTEM = 'SYSTEM';
}
