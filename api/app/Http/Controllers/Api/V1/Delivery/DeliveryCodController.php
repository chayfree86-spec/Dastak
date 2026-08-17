<?php

namespace App\Http\Controllers\Api\V1\Delivery;

use App\Enums\CodStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\DepositCodRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\CodCollectionResource;
use App\Models\CodCollection;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryCodController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    public function ledger(Request $request): JsonResponse
    {
        $collections = CodCollection::where('delivery_boy_id', $request->user()->id)
            ->with(['order', 'verifiedByAdmin'])
            ->latest('id')
            ->paginate((int) $request->input('per_page', 20));

        $pendingAmount = (float) CodCollection::where('delivery_boy_id', $request->user()->id)
            ->where('status', CodStatus::COLLECTED)
            ->sum('amount');

        return ApiResponse::paginated(
            paginator: $collections,
            resourceClass: CodCollectionResource::class,
            message: 'Rider cash collection ledger.',
            extraMeta: ['pending_cash_in_hand' => $pendingAmount]
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
