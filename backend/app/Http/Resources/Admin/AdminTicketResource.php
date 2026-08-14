<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Ticket row shape for src/pages/support/SupportTickets.jsx.
 * The list row is also passed straight into TicketDetailsModal, so it must
 * carry message / admin_reply / replied_at as well.
 */
class AdminTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $messages = $this->relationLoaded('messages')
            ? $this->messages->sortBy('created_at')->values()
            : collect();

        $customerMsg = $messages->firstWhere('sender_type', 'CUSTOMER') ?? $messages->first();
        $agentReply = $messages->where('sender_type', 'SUPPORT_AGENT')->last();

        $status = $this->status?->value ?? (string) $this->status;
        if ($status === 'CLOSED') {
            $status = 'RESOLVED';
        }

        return [
            'id' => $this->id,
            'ticket_number' => $this->ticket_number,
            'customer_name' => $this->user?->name ?? 'Customer',
            'order_id' => $this->order?->order_number,
            'subject' => $this->subject,
            'message' => $customerMsg?->message ?? $this->subject,
            'status' => $status,
            'created_at' => $this->created_at?->toIso8601String(),
            'admin_reply' => $agentReply?->message,
            'replied_at' => $agentReply?->created_at?->toIso8601String(),
        ];
    }
}
