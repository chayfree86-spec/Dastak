<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'gender',
        'date_of_birth',
        'alternate_mobile',
        'loyalty_points',
        'preferences',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'loyalty_points' => 'integer',
        'preferences' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
