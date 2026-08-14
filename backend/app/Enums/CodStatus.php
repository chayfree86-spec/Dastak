<?php

namespace App\Enums;

enum CodStatus: string
{
    case COLLECTED = 'COLLECTED';
    case DEPOSITED_TO_OFFICE = 'DEPOSITED_TO_OFFICE';
    case VERIFIED = 'VERIFIED';
}
