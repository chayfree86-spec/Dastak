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
        'dietary_preference',
        'date_of_birth',
        'anniversary_date',
        'alternate_mobile',
        'loyalty_points',
        'preferences',
        'taste_preferences',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'anniversary_date' => 'date',
        'loyalty_points' => 'integer',
        'preferences' => 'array',
        'taste_preferences' => 'array',
    ];

    /**
     * Calculate profile completion percentage based on filled attributes
     */
    public function getCompletionPercentageAttribute(): int
    {
        $user = $this->user;
        $score = 0;

        if ($user) {
            if (!empty($user->name)) $score += 15;
            if (!empty($user->email)) $score += 15;
            if (!empty($user->mobile)) $score += 15;
        }

        if (!empty($this->gender)) $score += 10;
        if (!empty($this->date_of_birth)) $score += 15;
        if (!empty($this->anniversary_date)) $score += 10;
        if (!empty($this->dietary_preference) || (!empty($this->taste_preferences) && count($this->taste_preferences) > 0)) {
            $score += 20;
        }

        return min(100, $score);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
