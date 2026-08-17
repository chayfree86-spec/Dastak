<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryChargeRule extends Model
{
    protected $fillable = [
        'type',
        'min_km',
        'max_km',
        'min_order',
        'fee',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'min_km' => 'decimal:2',
        'max_km' => 'decimal:2',
        'min_order' => 'decimal:2',
        'fee' => 'decimal:2',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
}
