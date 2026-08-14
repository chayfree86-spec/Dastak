<?php

namespace App\Services;

use App\Enums\TicketCategory;
use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\User;
use Illuminate\Support\Str;

class SupportTicketService
{
    public function createTicket(User $user, array $data): SupportTicket
    {
        $ticketNumber = 'TCK-' . date('Ymd') . '-' . strtoupper(Str::random(5));

        $ticket = SupportTicket::create([
            'ticket_number' => $ticketNumber,
            'user_id' => $user->id,
            'order_id' => $data['order_id'] ?? null,
            'subject' => $data['subject'],
            'category' => $data['category'] ?? TicketCategory::OTHER->value,
            'priority' => $data['priority'] ?? TicketPriority::MEDIUM->value,
            'status' => TicketStatus::OPEN,
        ]);

        // Add initial message
        if (! empty($data['message'])) {
            $this->addMessage(
                ticket: $ticket,
                sender: $user,
                message: $data['message'],
                attachmentUrl: $data['attachment_url'] ?? null,
                senderType: 'CUSTOMER'
            );
        }

        return $ticket->fresh(['messages', 'order', 'user']);
    }

    public function addMessage(
        SupportTicket $ticket,
        User $sender,
        string $message,
        ?string $attachmentUrl = null,
        string $senderType = 'CUSTOMER'
    ): SupportTicketMessage {
        $msg = SupportTicketMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => $sender->id,
            'sender_type' => $senderType,
            'message' => $message,
            'attachment_url' => $attachmentUrl,
            'created_at' => now(),
        ]);

        if ($senderType === 'CUSTOMER' && $ticket->status === TicketStatus::RESOLVED) {
            $ticket->update(['status' => TicketStatus::IN_PROGRESS]);
        }

        return $msg;
    }

    public function updateStatus(SupportTicket $ticket, TicketStatus $status, ?User $agent = null): SupportTicket
    {
        $ticket->status = $status;
        if ($status === TicketStatus::RESOLVED || $status === TicketStatus::CLOSED) {
            $ticket->resolved_at = now();
        }

        if ($agent && ! $ticket->assigned_to) {
            $ticket->assigned_to = $agent->id;
        }

        $ticket->save();

        return $ticket->fresh(['assignedAgent', 'user', 'messages']);
    }

    public function assignAgent(SupportTicket $ticket, User $agent): SupportTicket
    {
        $ticket->update([
            'assigned_to' => $agent->id,
            'status' => $ticket->status === TicketStatus::OPEN ? TicketStatus::IN_PROGRESS : $ticket->status,
        ]);

        return $ticket->fresh(['assignedAgent']);
    }
}
