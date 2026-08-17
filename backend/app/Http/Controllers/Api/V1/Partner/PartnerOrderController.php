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

    protected function getPartnerRestaurant(Request $request): Restaurant
    {
        $user = $request->user();
        $restaurant = null;
        if ($user) {
            $restaurant = Restaurant::where('owner_id', $user->id)->first()
                ?? $user->restaurants()->first();
        }

        if (! $restaurant) {
            $restaurant = Restaurant::where('name', 'like', '%Chay Chaupal%')->first()
                ?? Restaurant::first();
        }

        if (! $restaurant) {
            abort(404, 'No restaurant associated with this partner account.');
        }

        return $restaurant;
    }

    public function index(Request $request): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);

        $filters = ['restaurant_id' => $restaurant->id];
        if ($request->filled('status')) {
            $filters['status'] = $request->input('status');
        }
        if ($request->filled('search')) {
            $filters['search'] = $request->input('search');
        }

        $orders = $this->orderService->listOrders(
            filters: $filters,
            perPage: (int) $request->input('per_page', 20)
        );

        return ApiResponse::paginated(
            paginator: $orders,
            resourceClass: OrderResource::class,
            message: 'Restaurant orders retrieved.'
        );
    }

    public function show(Request $request, string $orderNumber): JsonResponse
    {
        $restaurant = $this->getPartnerRestaurant($request);

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

        $data = $request->validate([
            'prep_time_minutes' => ['nullable', 'integer', 'min:5', 'max:120'],
        ]);

        $order = $this->orderService->confirmOrder(
            order: $order,
            actor: $request->user(),
            prepTimeMinutes: $data['prep_time_minutes'] ?? $order->restaurant?->preparation_time_minutes ?? 15
        );

        return ApiResponse::success(new OrderResource($order), 'Order accepted and sent to kitchen.');
    }

    public function markPreparing(Request $request, string $orderNumber): JsonResponse
    {
        $order = $this->getPartnerOrder($request, $orderNumber);

        if (! in_array($order->status, [OrderStatus::PENDING, OrderStatus::CONFIRMED])) {
            throw ValidationException::withMessages([
                'order' => ['Order must be confirmed before marking as preparing.'],
            ]);
        }

        $order = $this->orderService->updateStatus(
            order: $order,
            newStatus: OrderStatus::PREPARING,
            actor: $request->user(),
            notes: 'Kitchen started preparation.'
        );

        return ApiResponse::success(new OrderResource($order), 'Order marked as preparing.');
    }

    public function markReady(Request $request, string $orderNumber): JsonResponse
    {
        $order = $this->getPartnerOrder($request, $orderNumber);

        if (! in_array($order->status, [OrderStatus::CONFIRMED, OrderStatus::PREPARING])) {
            throw ValidationException::withMessages([
                'order' => ['Order must be confirmed or preparing before marking ready for pickup.'],
            ]);
        }

        $order = $this->orderService->markReadyForPickup(
            order: $order,
            actor: $request->user()
        );

        return ApiResponse::success(
            new OrderResource($order),
            'Order is marked ready for delivery pickup.'
        );
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
        $restaurant = $this->getPartnerRestaurant($request);

        return Order::where('restaurant_id', $restaurant->id)
            ->where('order_number', $orderNumber)
            ->firstOrFail();
    }
}
