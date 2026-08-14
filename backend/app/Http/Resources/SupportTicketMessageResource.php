<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupportTicketMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sender_id' => $this->user_id,
            'sender_name' => $this->user?->name,
            'sender_type' => $this->sender_type,
            'message' => $this->message,
            'attachment_url' => $this->attachment_url,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
