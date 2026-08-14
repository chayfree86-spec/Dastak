<?php

namespace App\Enums;

enum FoodType: string
{
    case VEG = 'VEG';
    case NON_VEG = 'NON_VEG';
    case EGG = 'EGG';

    public function label(): string
    {
        return match ($this) {
            self::VEG => 'Pure Vegetarian',
            self::NON_VEG => 'Non-Vegetarian',
            self::EGG => 'Contains Egg',
        };
    }
}
