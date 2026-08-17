<?php

namespace App\Enums;

enum SmsChannel: string
{
    case SMS = 'SMS';
    case WHATSAPP = 'WHATSAPP';
}
