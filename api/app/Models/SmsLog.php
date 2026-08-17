<?php

namespace App\Models;

use App\Enums\SmsChannel;
use App\Enums\SmsStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'recipient',
        'channel',
        'template_name',
        'message_body',
        'provider',
        'provider_message_id',
        'status',
        'error_message',
    ];

    protected $casts = [
        'channel' => SmsChannel::class,
        'status' => SmsStatus::class,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
