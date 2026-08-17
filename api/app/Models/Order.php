<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentMode;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_number',
        'customer_id',
        'restaurant_id',
        'delivery_boy_id',
        'status',
        'payment_status',
        'payment_mode',
        'subtotal',
        'discount_amount',
        'delivery_fee',
        'tax_amount',
        'total_amount',
        'commission_rate',
        'commission_amount',
        'restaurant_payout_amount',
        'delivery_address_json',
        'special_instructions',
        'delivery_otp',
        'estimated_delivery_minutes',
        'placed_at',
        'confirmed_at',
        'preparing_at',
        'ready_at',
        'dispatched_at',
        'delivered_at',
        'cancelled_at',
        'cancellation_reason',
        'cancelled_by',
    ];

    protected $casts = [
        'status' => OrderStatus::class,
        'payment_status' => PaymentStatus::class,
        'payment_mode' => PaymentMode::class,
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'restaurant_payout_amount' => 'decimal:2',
        'delivery_address_json' => 'array',
        'estimated_delivery_minutes' => 'integer',
        'placed_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'preparing_at' => 'datetime',
        'ready_at' => 'datetime',
        'dispatched_at' => 'datetime',
        'delivered_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function deliveryBoy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delivery_boy_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class)->with('addons');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

    public function codCollection(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(CodCollection::class);
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class)->latest('id');
    }

    public function settlementOrders(): HasMany
    {
        return $this->hasMany(SettlementOrder::class);
    }

    public function canBeCancelledByCustomer(): bool
    {
        if ($this->status->isFinal()) {
            return false;
        }

        // Must be in PENDING or CONFIRMED state
        if (! in_array($this->status, [OrderStatus::PENDING, OrderStatus::CONFIRMED])) {
            return false;
        }

        // Grace window: within 5 minutes of placing order
        $cancelGraceMinutes = (int) config('dastak.orders.cancel_window_minutes', 5);
        return $this->placed_at->diffInMinutes(now()) <= $cancelGraceMinutes;
    }
}
