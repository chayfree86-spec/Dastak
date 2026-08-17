<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProcessRefundRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\CodCollectionResource;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\RefundResource;
use App\Models\CodCollection;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Refund;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceAdminController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    public function payments(Request $request): JsonResponse
    {
        $query = Payment::with(['order', 'user'])->latest('id');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('gateway')) {
            $query->where('gateway', $request->input('gateway'));
        }

        $payments = $query->paginate((int) $request->input('per_page', 20));

        return ApiResponse::paginated(
            paginator: $payments,
            resourceClass: PaymentResource::class,
            message: 'Transactions list retrieved.'
        );
    }

    public function refunds(Request $request): JsonResponse
    {
        $query = Refund::with(['order', 'payment'])->latest('id');

        $refunds = $query->paginate((int) $request->input('per_page', 20));

        return ApiResponse::paginated(
            paginator: $refunds,
            resourceClass: RefundResource::class,
            message: 'Refund records retrieved.'
        );
    }

    public function processRefund(ProcessRefundRequest $request): JsonResponse
    {
        $order = Order::findOrFail($request->input('order_id'));

        $refund = $this->paymentService->processRefund(
            order: $order,
            amount: $request->filled('amount') ? (float) $request->input('amount') : null,
            reason: $request->input('reason')
        );

        return ApiResponse::success(
            new RefundResource($refund),
            'Refund processed successfully.'
        );
    }

    public function codCollections(Request $request): JsonResponse
    {
        $query = CodCollection::with(['order', 'deliveryBoy', 'verifiedByAdmin'])->latest('id');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('delivery_boy_id')) {
            $query->where('delivery_boy_id', $request->input('delivery_boy_id'));
        }

        $collections = $query->paginate((int) $request->input('per_page', 20));

        return ApiResponse::paginated(
            paginator: $collections,
            resourceClass: CodCollectionResource::class,
            message: 'Rider cash collections list.'
        );
    }

    public function verifyCodDeposit(Request $request, int $id): JsonResponse
    {
        $collection = $this->paymentService->verifyCodDeposit(
            collectionId: $id,
            financeAdmin: $request->user()
        );

        return ApiResponse::success(
            new CodCollectionResource($collection),
            'COD cash deposit verified and settled.'
        );
    }
}
