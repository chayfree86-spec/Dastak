<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'customer_id',
        'restaurant_id',
        'delivery_boy_id',
        'food_rating',
        'delivery_rating',
        'comment',
        'restaurant_reply',
        'restaurant_replied_at',
        'is_visible',
    ];

    protected $casts = [
        'food_rating' => 'integer',
        'delivery_rating' => 'integer',
        'restaurant_replied_at' => 'datetime',
        'is_visible' => 'boolean',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

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
}
