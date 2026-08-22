<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Enums\ActorType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Order\CancelOrderRequest;
use App\Http\Requests\Order\CheckoutRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use App\Services\StoreHoursService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CustomerOrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    public function checkout(CheckoutRequest $request, StoreHoursService $store): JsonResponse
    {
        // Enforce service hours — no orders while ordering is closed.
        $status = $store->status();
        if (! $status['is_open']) {
            return ApiResponse::error(
                $status['message'] ?: 'Ordering is currently closed. Please try again during open hours.',
                ['service_status' => $status],
                422
            );
        }

        $order = $this->orderService->checkout(
            user: $request->user(),
            checkoutData: $request->validated()
        );

        return ApiResponse::success(
            new OrderResource($order),
            'Order placed successfully!',
            201
        );
    }

    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $query = Order::query()
            ->with(['items.addons', 'restaurant', 'deliveryBoy.deliveryProfile', 'statusHistories'])
            ->latest('id');

        if ($userId) {
            $query->where('customer_id', $userId);
        }

        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'active') {
                $query->whereNotIn('status', [
                    \App\Enums\OrderStatus::DELIVERED->value,
                    \App\Enums\OrderStatus::CANCELLED->value,
                    \App\Enums\OrderStatus::REJECTED->value,
                    \App\Enums\OrderStatus::FAILED->value,
                ]);
            } else {
                $query->where('status', $status);
            }
        }

        $orders = $query->paginate((int) $request->input('per_page', 10));

        return ApiResponse::paginated(
            paginator: $orders,
            resourceClass: OrderResource::class,
            message: 'Order history retrieved.'
        );
    }

    public function show(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::where('customer_id', $request->user()->id)
            ->where('order_number', $orderNumber)
            ->with(['items.addons', 'restaurant', 'deliveryBoy.deliveryProfile', 'statusHistories'])
            ->firstOrFail();

        return ApiResponse::success(
            new OrderResource($order),
            'Order tracking details retrieved.'
        );
    }

    public function cancel(CancelOrderRequest $request, string $orderNumber): JsonResponse
    {
        $order = Order::where('customer_id', $request->user()->id)
            ->where('order_number', $orderNumber)
            ->firstOrFail();

        if (! $order->canBeCancelledByCustomer()) {
            throw ValidationException::withMessages([
                'order' => ['Order cancellation window has expired or the order is already preparing.'],
            ]);
        }

        $order = $this->orderService->cancelOrder(
            order: $order,
            actor: $request->user(),
            reason: $request->input('reason'),
            cancelledBy: 'CUSTOMER'
        );

        return ApiResponse::success(
            new OrderResource($order),
            'Order cancelled successfully.'
        );
    }
}
