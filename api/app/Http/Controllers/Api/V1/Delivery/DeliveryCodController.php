<?php

namespace App\Http\Controllers\Api\V1\Delivery;

use App\Enums\CodStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\DepositCodRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\CodCollectionResource;
use App\Models\CodCollection;
use App\Services\PaymentService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryCodController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    public function ledger(Request $request): JsonResponse
    {
        $query = CodCollection::where('delivery_boy_id', $request->user()->id)
            ->with(['order.items', 'order.restaurant', 'order.customer', 'verifiedByAdmin'])
            ->latest('id');

        // Filter by Status (COLLECTED, DEPOSITED_TO_OFFICE, VERIFIED)
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Filter by Date Range / Quick Date
        if ($datePreset = $request->input('preset')) {
            match ($datePreset) {
                'today' => $query->whereDate('created_at', Carbon::today()),
                'yesterday' => $query->whereDate('created_at', Carbon::yesterday()),
                'week' => $query->where('created_at', '>=', Carbon::now()->startOfWeek()),
                'month' => $query->where('created_at', '>=', Carbon::now()->startOfMonth()),
                default => null,
            };
        } elseif ($request->filled('date_from')) {
            $from = Carbon::parse($request->input('date_from'))->startOfDay();
            $to = $request->filled('date_to')
                ? Carbon::parse($request->input('date_to'))->endOfDay()
                : Carbon::now()->endOfDay();

            $query->whereBetween('created_at', [$from, $to]);
        }

        // Search by Order Number
        if ($search = $request->input('search')) {
            $query->whereHas('order', function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%");
            });
        }

        $collections = $query->paginate((int) $request->input('per_page', 25));

        // Metric Counters
        $pendingAmount = (float) CodCollection::where('delivery_boy_id', $request->user()->id)
            ->where('status', CodStatus::COLLECTED)
            ->sum('amount');

        $todayCollected = (float) CodCollection::where('delivery_boy_id', $request->user()->id)
            ->whereDate('created_at', Carbon::today())
            ->sum('amount');

        $totalDeposited = (float) CodCollection::where('delivery_boy_id', $request->user()->id)
            ->whereIn('status', [CodStatus::DEPOSITED_TO_OFFICE, CodStatus::VERIFIED])
            ->sum('amount');

        return ApiResponse::paginated(
            paginator: $collections,
            resourceClass: CodCollectionResource::class,
            message: 'Rider cash collection ledger.',
            extraMeta: [
                'pending_cash_in_hand' => $pendingAmount,
                'today_collected' => $todayCollected,
                'total_deposited' => $totalDeposited,
            ]
        );
    }

    public function deposit(DepositCodRequest $request): JsonResponse
    {
        $this->paymentService->depositCod(
            rider: $request->user(),
            collectionIds: $request->input('collection_ids')
        );

        return ApiResponse::success(
            null,
            'COD cash deposit request submitted to office.'
        );
    }
}
