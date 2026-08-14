<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ActorType;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminOrderDetailResource;
use App\Http\Resources\Admin\AdminOrderListResource;
use App\Http\Resources\ApiResponse;
use App\Models\Order;
use App\Models\User;
use App\Services\DispatchService;
use App\Services\OrderService;
use App\Support\AdminOrderMap;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class OrderAdminController extends Controller
{
    public function __construct(
        protected OrderService $orderService,
        protected DispatchService $dispatchService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = [];

        // Translate frontend status / payment tokens to backend enum values.
        if ($request->filled('status')) {
            $backendStatus = AdminOrderMap::statusToBackend($request->input('status'));
            if ($backendStatus) {
                $filters['status'] = $backendStatus;
            }
        }
        if ($request->filled('payment_method')) {
            $filters['payment_mode'] = AdminOrderMap::paymentToBackend($request->input('payment_method'));
        }
        if ($request->filled('restaurant_id')) {
            $filters['restaurant_id'] = $request->input('restaurant_id');
        }
        if ($request->filled('search')) {
            $filters['search'] = $request->input('search');
        }

        $orders = $this->orderService->listOrders(
            filters: $filters,
            perPage: (int) $request->input('per_page', 10)
        );

        return ApiResponse::paginated(
            paginator: $orders,
            resourceClass: AdminOrderListResource::class,
            message: 'All platform orders retrieved.'
        );
    }

    public function show(int $id): JsonResponse
    {
        $order = $this->loadOrder($id);

        return ApiResponse::success(
            new AdminOrderDetailResource($order),
            'Order details retrieved.'
        );
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate(['status' => ['required', 'string']]);

        $backendValue = AdminOrderMap::statusToBackend($request->input('status'));
        $targetStatus = $backendValue ? OrderStatus::tryFrom($backendValue) : null;

        if (! $targetStatus) {
            throw ValidationException::withMessages([
                'status' => ['Unsupported order status: '.$request->input('status')],
            ]);
        }

        $order = Order::findOrFail($id);

        $this->orderService->transitionStatus(
            order: $order,
            targetStatus: $targetStatus,
            actor: $request->user(),
            actorType: ActorType::ADMIN,
            comment: 'Status updated by administrator.'
        );

        return ApiResponse::success(
            new AdminOrderDetailResource($this->loadOrder($id)),
            'Order status updated successfully.'
        );
    }

    public function assignDelivery(Request $request, int $id): JsonResponse
    {
        $riderId = $request->input('delivery_boy_id', $request->input('rider_id'));
        $request->validate([], []);

        if (! $riderId) {
            throw ValidationException::withMessages([
                'delivery_boy_id' => ['A delivery boy must be selected.'],
            ]);
        }

        $order = Order::findOrFail($id);
        $rider = User::findOrFail($riderId);

        $this->dispatchService->manualAssignRider(
            order: $order,
            rider: $rider,
            admin: $request->user()
        );

        return ApiResponse::success(
            new AdminOrderDetailResource($this->loadOrder($id)),
            'Delivery boy assigned successfully.'
        );
    }

    public function reassignDelivery(Request $request, int $id): JsonResponse
    {
        return $this->assignDelivery($request, $id);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => ['required', 'string', 'max:500']]);

        $order = Order::findOrFail($id);

        $this->orderService->cancelOrder(
            order: $order,
            actor: $request->user(),
            reason: $request->input('reason'),
            cancelledBy: 'ADMIN'
        );

        return ApiResponse::success(
            new AdminOrderDetailResource($this->loadOrder($id)),
            'Order cancelled by administrator.'
        );
    }

    public function timeline(int $id): JsonResponse
    {
        $order = $this->loadOrder($id);

        return ApiResponse::success(
            (new AdminOrderDetailResource($order))->toArray(request())['timeline'],
            'Order timeline retrieved.'
        );
    }

    protected function loadOrder(int $id): Order
    {
        return Order::with([
            'items.addons',
            'restaurant',
            'customer',
            'deliveryBoy.deliveryProfile',
            'statusHistories',
        ])->findOrFail($id);
    }
}
