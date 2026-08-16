<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\AccountStatus;
use App\Enums\CodStatus;
use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Models\CodCollection;
use App\Models\Order;
use App\Models\User;
use App\Support\AdminOrderMap;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Backs the admin Delivery Boys screens (src/pages/deliveryBoys/*) under
 * /admin/delivery-boys. Riders are Users holding the "delivery_boy" role plus a
 * DeliveryBoyProfile.
 */
class DeliveryBoyAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->whereHas('roles', fn (Builder $q) => $q->where('slug', UserRole::DELIVERY_BOY->value))
            ->with('deliveryProfile');

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(fn ($q) => $q->where('name', 'like', "%{$s}%")->orWhere('mobile', 'like', "%{$s}%"));
        }

        if ($request->filled('status')) {
            $query->where('status', strtoupper($request->input('status')) === 'ACTIVE'
                ? AccountStatus::ACTIVE->value
                : AccountStatus::SUSPENDED->value);
        }

        if ($request->has('is_online') && $request->input('is_online') !== null && $request->input('is_online') !== '') {
            $online = filter_var($request->input('is_online'), FILTER_VALIDATE_BOOLEAN);
            $query->whereHas('deliveryProfile', fn ($q) => $q->where('is_online', $online));
        }

        $paginator = $query->latest('id')->paginate((int) $request->input('per_page', 10));
        $paginator->getCollection()->transform(fn ($u) => $this->listRow($u));

        return ApiResponse::success($paginator->items(), 'Delivery boys retrieved.', 200, [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $rider = User::with('deliveryProfile')->findOrFail($id);
        $p = $rider->deliveryProfile;

        $delivered = $rider->riderOrders()->where('status', OrderStatus::DELIVERED->value);

        return ApiResponse::success([
            'id' => $rider->id,
            'name' => $rider->name,
            'mobile' => $rider->mobile,
            'emergency_contact' => null,
            'email' => $rider->email,
            'address' => null,
            'vehicle_type' => $p?->vehicle_type?->value,
            'vehicle_number' => $p?->vehicle_number,
            'license_number' => $p?->driving_license_number,
            'latitude' => $p?->current_latitude ? (float) $p->current_latitude : null,
            'longitude' => $p?->current_longitude ? (float) $p->current_longitude : null,
            'speed' => null,
            'heading' => null,
            'status' => $this->statusLabel($rider),
            'is_online' => (bool) $p?->is_online,
            'rating' => (float) ($p?->rating ?? 0),
            'total_deliveries' => (int) $rider->riderOrders()->count(),
            'completed_deliveries' => (int) (clone $delivered)->count(),
            'failed_deliveries' => (int) $rider->riderOrders()->whereIn('status', [OrderStatus::FAILED->value, OrderStatus::CANCELLED->value])->count(),
            'lifetime_earnings' => (float) (clone $delivered)->sum('delivery_fee'),
            'today_earnings' => (float) $rider->riderOrders()->whereDate('delivered_at', Carbon::today())->sum('delivery_fee'),
            'cod_collected_pending' => (float) ($p?->pending_cod_amount ?? 0),
            'current_active_order' => $this->currentActiveOrder($rider),
        ], 'Delivery boy profile retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'mobile' => ['required', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:150'],
            'vehicle_type' => ['nullable', 'string', 'max:30'],
            'vehicle_number' => ['nullable', 'string', 'max:30'],
            'license_number' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string'],
        ]);

        $rider = User::create([
            'name' => $data['name'],
            'email' => $data['email'] ?? ('rider_'.Str::lower(Str::random(8)).'@dastak.local'),
            'mobile' => $data['mobile'],
            'password' => Hash::make(Str::random(16)),
            'status' => AccountStatus::ACTIVE,
            'email_verified_at' => now(),
        ]);
        $rider->assignRole(UserRole::DELIVERY_BOY);

        $rider->deliveryProfile()->create([
            'vehicle_type' => strtoupper($data['vehicle_type'] ?? 'MOTORCYCLE'),
            'vehicle_number' => $data['vehicle_number'] ?? null,
            'driving_license_number' => $data['license_number'] ?? null,
            'is_online' => false,
        ]);

        return ApiResponse::success(['id' => $rider->id], 'Delivery boy onboarded successfully.', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'mobile' => ['sometimes', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:150'],
            'vehicle_type' => ['nullable', 'string', 'max:30'],
            'vehicle_number' => ['nullable', 'string', 'max:30'],
            'license_number' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string'],
        ]);

        $rider = User::findOrFail($id);

        $userUpdate = [];
        if (array_key_exists('name', $data)) $userUpdate['name'] = $data['name'];
        if (array_key_exists('mobile', $data)) $userUpdate['mobile'] = $data['mobile'];
        if (! empty($data['email'])) $userUpdate['email'] = $data['email'];
        if (! empty($data['status'])) {
            $userUpdate['status'] = strtoupper($data['status']) === 'ACTIVE' ? AccountStatus::ACTIVE : AccountStatus::SUSPENDED;
        }
        if ($userUpdate) {
            $rider->update($userUpdate);
        }

        $profileUpdate = [];
        if (! empty($data['vehicle_type'])) $profileUpdate['vehicle_type'] = strtoupper($data['vehicle_type']);
        if (array_key_exists('vehicle_number', $data)) $profileUpdate['vehicle_number'] = $data['vehicle_number'];
        if (array_key_exists('license_number', $data)) $profileUpdate['driving_license_number'] = $data['license_number'];
        if ($profileUpdate) {
            $rider->deliveryProfile()->updateOrCreate(['user_id' => $rider->id], $profileUpdate);
        }

        return ApiResponse::success(['id' => $rider->id], 'Delivery boy updated successfully.');
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'string', 'in:ACTIVE,SUSPENDED']]);

        $rider = User::findOrFail($id);
        $rider->update([
            'status' => strtoupper($data['status']) === 'ACTIVE' ? AccountStatus::ACTIVE : AccountStatus::SUSPENDED,
        ]);

        return ApiResponse::success(
            ['id' => $rider->id, 'status' => $this->statusLabel($rider->fresh())],
            'Delivery boy status updated.'
        );
    }

    public function orderHistory(Request $request, int $id): JsonResponse
    {
        $orders = Order::with(['restaurant', 'customer'])
            ->where('delivery_boy_id', $id)
            ->latest('placed_at')
            ->limit((int) $request->input('limit', 10))
            ->get();

        $rows = $orders->map(fn ($o) => [
            'id' => $o->id,
            'restaurant' => $o->restaurant?->name,
            'customer' => $o->customer?->name,
            'amount' => (float) $o->total_amount,
            'status' => AdminOrderMap::statusToFrontend($o->status),
            'trip_earning' => (float) $o->delivery_fee,
            'time' => ($o->placed_at ?? $o->created_at)?->toIso8601String(),
        ])->values();

        return ApiResponse::success($rows, 'Rider order history retrieved.');
    }

    public function activeDeliveries(int $id): JsonResponse
    {
        $rider = User::findOrFail($id);

        return ApiResponse::success(
            array_filter([$this->currentActiveOrder($rider)]),
            'Active deliveries retrieved.'
        );
    }

    public function earnings(int $id): JsonResponse
    {
        $rider = User::findOrFail($id);
        $delivered = $rider->riderOrders()->where('status', OrderStatus::DELIVERED->value);

        return ApiResponse::success([
            'lifetime_earnings' => (float) (clone $delivered)->sum('delivery_fee'),
            'total_deliveries' => (int) (clone $delivered)->count(),
            'today_earnings' => (float) $rider->riderOrders()->whereDate('delivered_at', Carbon::today())->sum('delivery_fee'),
        ], 'Rider earnings retrieved.');
    }

    public function codCollection(int $id): JsonResponse
    {
        $rider = User::with('deliveryProfile')->findOrFail($id);

        $collections = CodCollection::with('order')
            ->where('delivery_boy_id', $id)
            ->latest('id')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'order_id' => $c->order?->order_number,
                'amount' => (float) $c->amount,
                'status' => $c->status?->value ?? (string) $c->status,
                'deposited_at' => $c->deposited_at?->toIso8601String(),
            ])->values();

        return ApiResponse::success([
            'pending_amount' => (float) ($rider->deliveryProfile?->pending_cod_amount ?? 0),
            'collections' => $collections,
        ], 'Rider COD ledger retrieved.');
    }

    public function reconcileCod(Request $request, int $id): JsonResponse
    {
        $rider = User::with('deliveryProfile')->findOrFail($id);

        CodCollection::where('delivery_boy_id', $id)
            ->where('status', CodStatus::COLLECTED->value)
            ->update([
                'status' => CodStatus::VERIFIED->value,
                'verified_by' => $request->user()->id,
                'verified_at' => now(),
            ]);

        $rider->deliveryProfile?->update(['pending_cod_amount' => 0]);

        return ApiResponse::success(
            ['id' => $rider->id, 'pending_cod_amount' => 0],
            'COD cash reconciled successfully.'
        );
    }

    protected function listRow(User $u): array
    {
        $p = $u->deliveryProfile;
        $active = $u->riderOrders()->where('status', OrderStatus::OUT_FOR_DELIVERY->value)->first();

        return [
            'id' => $u->id,
            'name' => $u->name,
            'mobile' => $u->mobile,
            'status' => $this->statusLabel($u),
            'is_online' => (bool) $p?->is_online,
            'current_order' => $active ? '#'.$active->order_number : null,
            'today_deliveries' => (int) $u->riderOrders()->whereDate('delivered_at', Carbon::today())->count(),
            'today_earnings' => (float) $u->riderOrders()->whereDate('delivered_at', Carbon::today())->sum('delivery_fee'),
            'cod_collected' => (float) ($p?->pending_cod_amount ?? 0),
            'rating' => (float) ($p?->rating ?? 0),
            'vehicle_type' => $p?->vehicle_type?->value,
        ];
    }

    protected function currentActiveOrder(User $rider): ?array
    {
        $order = $rider->riderOrders()
            ->with(['restaurant', 'customer'])
            ->where('status', OrderStatus::OUT_FOR_DELIVERY->value)
            ->latest('dispatched_at')
            ->first();

        if (! $order) {
            return null;
        }

        $addr = is_array($order->delivery_address_json) ? $order->delivery_address_json : [];

        return [
            'id' => $order->id,
            'restaurant' => $order->restaurant?->name,
            'customer' => $order->customer?->name,
            'address' => $addr['address_line1'] ?? null,
            'amount' => (float) $order->total_amount,
            'payment' => AdminOrderMap::paymentToFrontend($order->payment_mode),
            'assigned_at' => ($order->dispatched_at ?? $order->updated_at)?->toIso8601String(),
        ];
    }

    protected function statusLabel(User $u): string
    {
        return $u->status === AccountStatus::ACTIVE ? 'ACTIVE' : 'SUSPENDED';
    }
}
