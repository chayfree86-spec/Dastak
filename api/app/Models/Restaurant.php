<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Restaurant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'owner_id',
        'zone_id',
        'name',
        'slug',
        'description',
        'logo',
        'banner',
        'phone',
        'email',
        'address_line1',
        'address_line2',
        'city',
        'pincode',
        'latitude',
        'longitude',
        'commission_rate',
        'settlement_cycle',
        'delivery_radius_km',
        'fssai_license_number',
        'gst_number',
        'is_pure_veg',
        'is_open',
        'is_active',
        'preparation_time_minutes',
        'min_order_value',
        'rating',
        'total_ratings',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'commission_rate' => 'decimal:2',
        'delivery_radius_km' => 'integer',
        'is_pure_veg' => 'boolean',
        'is_open' => 'boolean',
        'is_active' => 'boolean',
        'preparation_time_minutes' => 'integer',
        'min_order_value' => 'decimal:2',
        'rating' => 'decimal:2',
        'total_ratings' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function ($restaurant) {
            if (empty($restaurant->slug)) {
                $restaurant->slug = Str::slug($restaurant->name) . '-' . Str::random(5);
            }
        });
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    public function operatingHours(): HasMany
    {
        return $this->hasMany(RestaurantOperatingHour::class);
    }

    public function bankAccount(): HasOne
    {
        return $this->hasOne(RestaurantBankAccount::class);
    }

    public function menuCategories(): HasMany
    {
        return $this->hasMany(MenuCategory::class)->orderBy('sort_order', 'asc');
    }

    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class)->orderBy('sort_order', 'asc');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class)->where('is_visible', true)->latest('id');
    }

    public function settlements(): HasMany
    {
        return $this->hasMany(RestaurantSettlement::class)->latest('id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Scope query to calculate distance (in KM) using Haversine formula
     */
    public function scopeWithDistance(Builder $query, float $latitude, float $longitude): Builder
    {
        // 6371 is Earth's radius in kilometers
        $haversine = "(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))))";

        return $query->select('*')
            ->selectRaw("{$haversine} AS distance", [$latitude, $longitude, $latitude]);
    }

    /**
     * Calculate Haversine distance between two coordinates in kilometers.
     */
    public static function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // in kilometers

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
