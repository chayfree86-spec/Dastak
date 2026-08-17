<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Support\StoreTicketMessageRequest;
use App\Http\Requests\Support\StoreTicketRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\SupportTicketMessageResource;
use App\Http\Resources\SupportTicketResource;
use App\Models\SupportTicket;
use App\Services\SupportTicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerTicketController extends Controller
{
    public function __construct(
        protected SupportTicketService $ticketService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $tickets = SupportTicket::where('user_id', $request->user()->id)
            ->with(['order', 'assignedAgent'])
            ->latest('id')
            ->paginate((int) $request->input('per_page', 10));

        return ApiResponse::paginated(
            paginator: $tickets,
            resourceClass: SupportTicketResource::class,
            message: 'Support tickets retrieved.'
        );
    }

    public function store(StoreTicketRequest $request): JsonResponse
    {
        $ticket = $this->ticketService->createTicket(
            user: $request->user(),
            data: $request->validated()
        );

        return ApiResponse::success(
            new SupportTicketResource($ticket),
            'Support ticket opened successfully.',
            201
        );
    }

    public function show(Request $request, string $ticketNumber): JsonResponse
    {
        $ticket = SupportTicket::where('user_id', $request->user()->id)
            ->where('ticket_number', $ticketNumber)
            ->with(['messages.user', 'order', 'assignedAgent'])
            ->firstOrFail();

        return ApiResponse::success(
            new SupportTicketResource($ticket),
            'Ticket details retrieved.'
        );
    }

    public function addMessage(StoreTicketMessageRequest $request, string $ticketNumber): JsonResponse
    {
        $ticket = SupportTicket::where('user_id', $request->user()->id)
            ->where('ticket_number', $ticketNumber)
            ->firstOrFail();

        $msg = $this->ticketService->addMessage(
            ticket: $ticket,
            sender: $request->user(),
            message: $request->input('message'),
            attachmentUrl: $request->input('attachment_url'),
            senderType: 'CUSTOMER'
        );

        return ApiResponse::success(
            new SupportTicketMessageResource($msg),
            'Message posted to ticket.',
            201
        );
    }
}
