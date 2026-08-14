<?php

namespace App\Enums;

enum DeviceType: string
{
    case ANDROID = 'ANDROID';
    case IOS = 'IOS';
    case WEB_PWA = 'WEB_PWA';
}
