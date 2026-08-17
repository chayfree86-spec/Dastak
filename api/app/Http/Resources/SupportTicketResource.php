<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupportTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_number' => $this->ticket_number,
            'subject' => $this->subject,
            'category' => $this->category?->value ?? (string) $this->category,
            'priority' => $this->priority?->value ?? (string) $this->priority,
            'status' => $this->status?->value ?? (string) $this->status,
            'user' => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'mobile' => $this->user?->mobile,
            ],
            'order' => $this->order ? [
                'id' => $this->order->id,
                'order_number' => $this->order->order_number,
                'status' => $this->order->status?->value,
                'total_amount' => (float) $this->order->total_amount,
            ] : null,
            'assigned_agent' => $this->assignedAgent ? [
                'id' => $this->assignedAgent->id,
                'name' => $this->assignedAgent->name,
            ] : null,
            'messages' => SupportTicketMessageResource::collection($this->whenLoaded('messages')),
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
