<?php

namespace App\Http\Controllers\Api\V1\Partner;

use App\Enums\ActorType;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Restaurant;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PartnerOrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $restaurant = Restaurant::where('owner_id', $request->user()->id)->firstOrFail();

        $filters = ['restaurant_id' => $restaurant->id];
        if ($request->filled('status')) {
            $filters['status'] = $request->input('status');
        }

        $orders = $this->orderService->listOrders(
            filters: $filters,
            perPage: (int) $request->input('per_page', 15)
        );

        return ApiResponse::paginated(
            paginator: $orders,
            resourceClass: OrderResource::class,
            message: 'Restaurant orders retrieved.'
        );
    }

    public function show(Request $request, string $orderNumber): JsonResponse
    {
        $restaurant = Restaurant::where('owner_id', $request->user()->id)->firstOrFail();

        $order = Order::where('restaurant_id', $restaurant->id)
            ->where('order_number', $orderNumber)
            ->with(['items.addons', 'customer', 'deliveryBoy.deliveryProfile', 'statusHistories'])
            ->firstOrFail();

        return ApiResponse::success(
            new OrderResource($order),
            'Order details retrieved.'
        );
    }

    public function accept(Request $request, string $orderNumber): JsonResponse
    {
        $order = $this->getPartnerOrder($request, $orderNumber);

        if ($order->status !== OrderStatus::PENDING) {
            throw ValidationException::withMessages([
                'order' => ['Only pending orders can be accepted.'],
            ]);
        }

        $order = $this->orderService->transitionStatus(
            order: $order,
            targetStatus: OrderStatus::CONFIRMED,
            actor: $request->user(),
            actorType: ActorType::RESTAURANT,
            comment: 'Order accepted by restaurant kitchen.'
        );

        return ApiResponse::success(new OrderResource($order), 'Order accepted.');
    }

    public function markPreparing(Request $request, string $orderNumber): JsonResponse
    {
        $order = $this->getPartnerOrder($request, $orderNumber);

        if ($order->status !== OrderStatus::CONFIRMED) {
            throw ValidationException::withMessages([
                'order' => ['Order must be confirmed before preparing.'],
            ]);
        }

        $order = $this->orderService->transitionStatus(
            order: $order,
            targetStatus: OrderStatus::PREPARING,
            actor: $request->user(),
            actorType: ActorType::RESTAURANT,
            comment: 'Chef started food preparation.'
        );

        return ApiResponse::success(new OrderResource($order), 'Order marked as preparing.');
    }

    public function markReady(Request $request, string $orderNumber): JsonResponse
    {
        $order = $this->getPartnerOrder($request, $orderNumber);

        if ($order->status !== OrderStatus::PREPARING) {
            throw ValidationException::withMessages([
                'order' => ['Order must be in preparing state.'],
            ]);
        }

        $order = $this->orderService->transitionStatus(
            order: $order,
            targetStatus: OrderStatus::READY_FOR_PICKUP,
            actor: $request->user(),
            actorType: ActorType::RESTAURANT,
            comment: 'Food is packed and ready for rider pickup.'
        );

        return ApiResponse::success(new OrderResource($order), 'Order marked ready for pickup.');
    }

    public function reject(Request $request, string $orderNumber): JsonResponse
    {
        $order = $this->getPartnerOrder($request, $orderNumber);

        if ($order->status !== OrderStatus::PENDING) {
            throw ValidationException::withMessages([
                'order' => ['Only pending orders can be rejected.'],
            ]);
        }

        $reason = $request->input('reason', 'Restaurant is overloaded or items out of stock.');

        $order = $this->orderService->cancelOrder(
            order: $order,
            actor: $request->user(),
            reason: $reason,
            cancelledBy: 'RESTAURANT'
        );

        return ApiResponse::success(new OrderResource($order), 'Order rejected.');
    }

    protected function getPartnerOrder(Request $request, string $orderNumber): Order
    {
        $restaurant = Restaurant::where('owner_id', $request->user()->id)->firstOrFail();

        return Order::where('restaurant_id', $restaurant->id)
            ->where('order_number', $orderNumber)
            ->firstOrFail();
    }
}
