<?php

namespace App\Models;

use App\Enums\CodStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CodCollection extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'delivery_boy_id',
        'amount',
        'status',
        'deposited_at',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'status' => CodStatus::class,
        'amount' => 'decimal:2',
        'deposited_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function deliveryBoy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delivery_boy_id');
    }

    public function verifiedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
