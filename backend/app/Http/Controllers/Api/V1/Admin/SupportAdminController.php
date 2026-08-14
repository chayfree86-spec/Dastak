<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\TicketStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateTicketStatusRequest;
use App\Http\Requests\Support\StoreTicketMessageRequest;
use App\Http\Resources\Admin\AdminTicketResource;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\SupportTicketMessageResource;
use App\Http\Resources\SupportTicketResource;
use App\Models\SupportTicket;
use App\Models\User;
use App\Services\SupportTicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportAdminController extends Controller
{
    public function __construct(
        protected SupportTicketService $ticketService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = SupportTicket::with(['user', 'assignedAgent', 'order', 'messages'])->latest('id');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('subject', 'like', "%{$s}%")
                    ->orWhere('ticket_number', 'like', "%{$s}%")
                    ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$s}%"));
            });
        }

        $tickets = $query->paginate((int) $request->input('per_page', 20));

        return ApiResponse::paginated(
            paginator: $tickets,
            resourceClass: AdminTicketResource::class,
            message: 'All support tickets retrieved.'
        );
    }

    public function show(int $id): JsonResponse
    {
        $ticket = SupportTicket::with(['messages.user', 'user', 'assignedAgent', 'order'])->findOrFail($id);

        return ApiResponse::success(
            new AdminTicketResource($ticket),
            'Ticket details retrieved.'
        );
    }

    public function reply(Request $request, int $id): JsonResponse
    {
        $request->validate(['message' => ['required', 'string']]);

        $ticket = SupportTicket::findOrFail($id);

        $this->ticketService->addMessage(
            ticket: $ticket,
            sender: $request->user(),
            message: $request->input('message'),
            attachmentUrl: null,
            senderType: 'SUPPORT_AGENT'
        );

        // First agent response moves an OPEN ticket into IN_PROGRESS.
        if ($ticket->status === TicketStatus::OPEN) {
            $this->ticketService->updateStatus($ticket, TicketStatus::IN_PROGRESS, $request->user());
        }

        $ticket->load(['user', 'order', 'messages']);

        return ApiResponse::success(
            new AdminTicketResource($ticket),
            'Reply sent to customer.',
            201
        );
    }

    public function assign(Request $request, int $id): JsonResponse
    {
        $ticket = SupportTicket::findOrFail($id);
        $agent = User::findOrFail($request->input('agent_id', $request->user()->id));

        $ticket = $this->ticketService->assignAgent($ticket, $agent);

        return ApiResponse::success(
            new SupportTicketResource($ticket),
            'Ticket assigned to support agent.'
        );
    }

    public function updateStatus(UpdateTicketStatusRequest $request, int $id): JsonResponse
    {
        $ticket = SupportTicket::findOrFail($id);
        $status = TicketStatus::from($request->input('status'));

        $ticket = $this->ticketService->updateStatus($ticket, $status, $request->user());

        return ApiResponse::success(
            new SupportTicketResource($ticket),
            'Ticket status updated.'
        );
    }

    public function addMessage(StoreTicketMessageRequest $request, int $id): JsonResponse
    {
        $ticket = SupportTicket::findOrFail($id);

        $msg = $this->ticketService->addMessage(
            ticket: $ticket,
            sender: $request->user(),
            message: $request->input('message'),
            attachmentUrl: $request->input('attachment_url'),
            senderType: 'SUPPORT_AGENT'
        );

        return ApiResponse::success(
            new SupportTicketMessageResource($msg),
            'Agent reply posted to ticket.',
            201
        );
    }
}
