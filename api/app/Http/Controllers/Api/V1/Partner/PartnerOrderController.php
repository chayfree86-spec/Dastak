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
        if ($request->filled('search')) {
            $filters['search'] = $request->input('search');
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
                'order' => ['This order has already been processed or is not in pending state.'],
            ]);
        }

        $prepTime = (int) $request->input('prep_time_minutes', 20);
        if ($prepTime < 5) $prepTime = 5;
        if ($prepTime > 180) $prepTime = 180;

        $order->update([
            'estimated_delivery_minutes' => $prepTime,
        ]);

        // Transition to CONFIRMED and PREPARING
        $order = $this->orderService->transitionStatus(
            order: $order,
            targetStatus: OrderStatus::CONFIRMED,
            actor: $request->user(),
            actorType: ActorType::RESTAURANT,
            comment: "Order accepted. Kitchen prep time set to {$prepTime} minutes."
        );

        $order = $this->orderService->transitionStatus(
            order: $order,
            targetStatus: OrderStatus::PREPARING,
            actor: $request->user(),
            actorType: ActorType::RESTAURANT,
            comment: 'Food preparation in progress.'
        );

        return ApiResponse::success(new OrderResource($order->fresh(['items.addons', 'customer', 'deliveryBoy'])), 'Order accepted and sent to kitchen.');
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

        if (! in_array($order->status, [OrderStatus::CONFIRMED, OrderStatus::PREPARING])) {
            throw ValidationException::withMessages([
                'order' => ['Order must be in confirmed or preparing state.'],
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
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $order = $this->getPartnerOrder($request, $orderNumber);

        if ($order->status !== OrderStatus::PENDING) {
            throw ValidationException::withMessages([
                'order' => ['Only pending orders can be rejected.'],
            ]);
        }

        $order = $this->orderService->cancelOrder(
            order: $order,
            actor: $request->user(),
            reason: $data['reason'],
            cancelledBy: 'RESTAURANT'
        );

        return ApiResponse::success(new OrderResource($order), 'Order rejected successfully.');
    }

    protected function getPartnerOrder(Request $request, string $orderNumber): Order
    {
        $restaurant = Restaurant::where('owner_id', $request->user()->id)->firstOrFail();

        return Order::where('restaurant_id', $restaurant->id)
            ->where('order_number', $orderNumber)
            ->firstOrFail();
    }
}
