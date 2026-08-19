<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppVerificationSession extends Model
{
    use HasFactory;

    protected $table = 'app_verification_sessions';

    protected $fillable = [
        'session_public_id',
        'app_type',
        'mobile_number',
        'device_identifier_hash',
        'device_platform',
        'otp_hash',
        'otp_plain',
        'status',
        'attempts',
        'verified_at',
        'revoked_at',
        'last_activity_at',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'attempts' => 'integer',
        'verified_at' => 'datetime',
        'revoked_at' => 'datetime',
        'last_activity_at' => 'datetime',
    ];

    public function isPending(): bool
    {
        return $this->status === 'PENDING';
    }

    public function isVerified(): bool
    {
        return $this->status === 'VERIFIED';
    }

    public function isRevoked(): bool
    {
        return $this->status === 'REVOKED' || $this->status === 'LOCKED';
    }
}
