<?php

namespace App\Models;

use App\Enums\VehicleType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryBoyProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'vehicle_type',
        'vehicle_number',
        'driving_license_number',
        'aadhar_number',
        'pan_number',
        'aadhar_path',
        'pan_path',
        'license_path',
        'bank_account_name',
        'bank_account_number',
        'bank_ifsc',
        'bank_upi_id',
        'is_online',
        'is_busy',
        'current_latitude',
        'current_longitude',
        'last_location_updated_at',
        'rating',
        'total_ratings',
        'total_deliveries',
        'pending_cod_amount',
        'total_earned_amount',
    ];

    protected $casts = [
        'vehicle_type' => VehicleType::class,
        'is_online' => 'boolean',
        'is_busy' => 'boolean',
        'current_latitude' => 'decimal:7',
        'current_longitude' => 'decimal:7',
        'last_location_updated_at' => 'datetime',
        'rating' => 'decimal:2',
        'total_ratings' => 'integer',
        'total_deliveries' => 'integer',
        'pending_cod_amount' => 'decimal:2',
        'total_earned_amount' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
