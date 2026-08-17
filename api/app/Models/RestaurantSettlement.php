<?php

namespace App\Models;

use App\Enums\PayoutMethod;
use App\Enums\SettlementStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RestaurantSettlement extends Model
{
    use HasFactory;

    protected $fillable = [
        'settlement_number',
        'restaurant_id',
        'period_start',
        'period_end',
        'total_orders_count',
        'gross_sales',
        'platform_commission',
        'tax_deducted',
        'net_payable',
        'status',
        'payout_method',
        'payout_reference',
        'paid_at',
        'processed_by',
        'notes',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'total_orders_count' => 'integer',
        'gross_sales' => 'decimal:2',
        'platform_commission' => 'decimal:2',
        'tax_deducted' => 'decimal:2',
        'net_payable' => 'decimal:2',
        'status' => SettlementStatus::class,
        'payout_method' => PayoutMethod::class,
        'paid_at' => 'datetime',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function processedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function settlementOrders(): HasMany
    {
        return $this->hasMany(SettlementOrder::class, 'settlement_id');
    }
}
