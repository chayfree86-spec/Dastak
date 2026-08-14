<?php

namespace App\Http\Controllers\Api\V1\Delivery;

use App\Enums\ActorType;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Order\VerifyDeliveryRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DeliveryOrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    public function assignedOrder(Request $request): JsonResponse
    {
        $order = Order::where('delivery_boy_id', $request->user()->id)
            ->whereNotIn('status', [OrderStatus::DELIVERED, OrderStatus::CANCELLED, OrderStatus::REJECTED, OrderStatus::FAILED])
            ->with(['items.addons', 'restaurant', 'customer', 'statusHistories'])
            ->latest('id')
            ->first();

        if (! $order) {
            return ApiResponse::success(null, 'No active order currently assigned.');
        }

        return ApiResponse::success(
            new OrderResource($order),
            'Active assigned order retrieved.'
        );
    }

    public function history(Request $request): JsonResponse
    {
        $orders = $this->orderService->listOrders(
            filters: ['delivery_boy_id' => $request->user()->id],
            perPage: (int) $request->input('per_page', 15)
        );

        return ApiResponse::paginated(
            paginator: $orders,
            resourceClass: OrderResource::class,
            message: 'Trip history retrieved.'
        );
    }

    public function pickupOrder(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::where('delivery_boy_id', $request->user()->id)
            ->where('order_number', $orderNumber)
            ->firstOrFail();

        if ($order->status !== OrderStatus::READY_FOR_PICKUP) {
            throw ValidationException::withMessages([
                'order' => ['Order is not yet marked ready for pickup by the restaurant.'],
            ]);
        }

        $order = $this->orderService->transitionStatus(
            order: $order,
            targetStatus: OrderStatus::OUT_FOR_DELIVERY,
            actor: $request->user(),
            actorType: ActorType::DELIVERY_BOY,
            comment: 'Rider picked up order from restaurant and is heading to customer location.'
        );

        return ApiResponse::success(
            new OrderResource($order),
            'Order picked up. Status changed to Out for Delivery.'
        );
    }

    public function verifyDelivery(VerifyDeliveryRequest $request, string $orderNumber): JsonResponse
    {
        $order = Order::where('delivery_boy_id', $request->user()->id)
            ->where('order_number', $orderNumber)
            ->firstOrFail();

        $order = $this->orderService->verifyDelivery(
            order: $order,
            otp: $request->input('otp'),
            rider: $request->user()
        );

        return ApiResponse::success(
            new OrderResource($order),
            'Order successfully verified and marked delivered!'
        );
    }
}
