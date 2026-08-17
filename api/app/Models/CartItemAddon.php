<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItemAddon extends Model
{
    use HasFactory;

    protected $fillable = [
        'cart_item_id',
        'addon_id',
        'price',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function cartItem(): BelongsTo
    {
        return $this->belongsTo(CartItem::class);
    }

    public function addon(): BelongsTo
    {
        return $this->belongsTo(MenuItemAddon::class, 'addon_id');
    }
}
