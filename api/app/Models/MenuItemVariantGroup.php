<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuItemVariantGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'menu_item_id',
        'name',
        'min_selection',
        'max_selection',
        'is_required',
        'sort_order',
    ];

    protected $casts = [
        'min_selection' => 'integer',
        'max_selection' => 'integer',
        'is_required' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(MenuItemVariant::class, 'variant_group_id')->orderBy('sort_order', 'asc');
    }
}
