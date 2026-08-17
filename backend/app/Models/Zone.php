<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Zone extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'city',
        'center_latitude',
        'center_longitude',
        'radius_km',
        'boundary_coordinates',
        'is_active',
    ];

    protected $casts = [
        'center_latitude' => 'decimal:7',
        'center_longitude' => 'decimal:7',
        'radius_km' => 'decimal:2',
        'boundary_coordinates' => 'array',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function ($zone) {
            if (empty($zone->slug)) {
                $base = Str::slug($zone->name ?: 'zone');
                $slug = $base;
                $i = 1;
                while (static::where('slug', $slug)->exists()) {
                    $slug = "{$base}-{$i}";
                    $i++;
                }
                $zone->slug = $slug;
            }
        });
    }

    public function restaurants(): HasMany
    {
        return $this->hasMany(Restaurant::class);
    }
}
