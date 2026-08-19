<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppDeviceSession extends Model
{
    use HasFactory;

    protected $table = 'app_device_sessions';

    protected $fillable = [
        'user_id',
        'app_type',
        'mobile_number',
        'session_token_hash',
        'device_identifier_hash',
        'device_name',
        'device_platform',
        'status',
        'last_seen_at',
        'revoked_at',
        'revocation_reason',
        'ip_address',
        'user_agent',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'last_seen_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'ACTIVE';
    }
}
