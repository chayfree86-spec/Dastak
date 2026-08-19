<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'level',
        'category',
        'event',
        'description',
        'actor_type',
        'actor_id',
        'actor_name',
        'reference_type',
        'reference_id',
        'request_id',
        'endpoint',
        'http_method',
        'http_status',
        'response_time_ms',
        'error_code',
        'metadata',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'http_status' => 'integer',
        'response_time_ms' => 'integer',
        'actor_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
