<?php

namespace App\Models;

use App\Enums\FoodType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class MenuItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'restaurant_id',
        'category_id',
        'name',
        'slug',
        'short_code',
        'description',
        'image',
        'base_price',
        'discount_price',
        'food_type',
        'is_available',
        'is_recommended',
        'preparation_time_minutes',
        'sort_order',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'food_type' => FoodType::class,
        'is_available' => 'boolean',
        'is_recommended' => 'boolean',
        'preparation_time_minutes' => 'integer',
        'sort_order' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function ($item) {
            if (empty($item->slug)) {
                $item->slug = Str::slug($item->name) . '-' . Str::random(4);
            }
        });
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    public function variantGroups(): HasMany
    {
        return $this->hasMany(MenuItemVariantGroup::class)->with('variants')->orderBy('sort_order', 'asc');
    }

    public function addonGroups(): HasMany
    {
        return $this->hasMany(MenuItemAddonGroup::class)->with('addons')->orderBy('sort_order', 'asc');
    }
}
