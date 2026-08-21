<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminOrderListResource;
use App\Http\Resources\ApiResponse;
use App\Models\SupportTicket;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Backs the admin Customers screens (src/pages/customers/*) under /admin/customers.
 * Customers are Users holding the "customer" role.
 */
class CustomerAdminController extends Controller
{
    public function __construct(protected OrderService $orderService) {}

    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->whereHas('roles', fn (Builder $q) => $q->where('slug', UserRole::CUSTOMER->value))
            ->with(['addresses' => fn ($q) => $q->where('is_default', true)])
            ->withCount('customerOrders');

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
                    ->orWhere('mobile', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', strtoupper($request->input('status')) === 'ACTIVE'
                ? AccountStatus::ACTIVE->value
                : AccountStatus::BLOCKED->value);
        }

        $paginator = $query->latest('id')->paginate((int) $request->input('per_page', 10));

        $paginator->getCollection()->transform(fn ($u) => $this->listRow($u));

        return ApiResponse::success($paginator->items(), 'Customers retrieved.', 200, [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $user = User::with(['addresses', 'customerProfile'])->findOrFail($id);

        $delivered = $user->customerOrders()->where('status', OrderStatus::DELIVERED->value);
        $totalSpend = (float) $delivered->sum('total_amount');
        $totalOrders = (int) $user->customerOrders()->count();
        $deliveredCount = (int) (clone $delivered)->count();
        $default = $user->addresses->firstWhere('is_default', true) ?? $user->addresses->first();
        $profile = $user->customerProfile;

        return ApiResponse::success([
            'id' => $user->id,
            'name' => $user->name,
            'mobile' => $user->mobile,
            'email' => $user->email,
            'avatar' => $user->avatar ? (str_starts_with($user->avatar, 'http') || str_starts_with($user->avatar, 'data:') ? $user->avatar : asset('storage/' . $user->avatar)) : null,
            'joined_date' => $user->created_at?->toIso8601String(),
            'status' => $this->statusLabel($user),
            'profile_completion_percentage' => $user->profile_completion_percentage,
            'gender' => $profile?->gender,
            'date_of_birth' => $profile?->date_of_birth?->format('Y-m-d'),
            'anniversary_date' => $profile?->anniversary_date?->format('Y-m-d'),
            'dietary_preference' => $profile?->dietary_preference,
            'taste_preferences' => $profile?->taste_preferences ?? [],
            'alternate_mobile' => $profile?->alternate_mobile,
            'loyalty_points' => (int) ($profile?->loyalty_points ?? 0),
            'total_orders' => $totalOrders,
            'total_spend' => $totalSpend,
            'average_order_value' => $deliveredCount > 0 ? round($totalSpend / $deliveredCount, 2) : 0.0,
            'latitude' => $default?->latitude ? (float) $default->latitude : null,
            'longitude' => $default?->longitude ? (float) $default->longitude : null,
            'zone_name' => null,
            'addresses' => $user->addresses->map(fn ($a) => $this->addressRow($a))->values(),
        ], 'Customer profile retrieved.');
    }

    public function orders(Request $request, int $id): JsonResponse
    {
        $orders = $this->orderService->listOrders(
            filters: ['customer_id' => $id],
            perPage: (int) $request->input('limit', $request->input('per_page', 10))
        );

        return ApiResponse::paginated(
            paginator: $orders,
            resourceClass: AdminOrderListResource::class,
            message: 'Customer orders retrieved.'
        );
    }

    public function addresses(int $id): JsonResponse
    {
        $user = User::with('addresses')->findOrFail($id);

        return ApiResponse::success(
            $user->addresses->map(fn ($a) => $this->addressRow($a))->values(),
            'Customer addresses retrieved.'
        );
    }

    public function toggleBlock(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'string', 'in:ACTIVE,BLOCKED']]);

        $user = User::findOrFail($id);
        $user->update([
            'status' => strtoupper($data['status']) === 'ACTIVE' ? AccountStatus::ACTIVE : AccountStatus::BLOCKED,
        ]);

        return ApiResponse::success(
            ['id' => $user->id, 'status' => $this->statusLabel($user->fresh())],
            'Customer status updated.'
        );
    }

    public function complaints(int $id): JsonResponse
    {
        $tickets = SupportTicket::where('user_id', $id)->with('messages')->latest('id')->get();

        $rows = $tickets->map(fn ($t) => [
            'id' => $t->id,
            'subject' => $t->subject,
            'status' => $t->status?->value ?? (string) $t->status,
            'created_at' => $t->created_at?->toIso8601String(),
        ])->values();

        return ApiResponse::success($rows, 'Customer complaints retrieved.');
    }

    protected function listRow(User $u): array
    {
        $delivered = $u->customerOrders()->where('status', OrderStatus::DELIVERED->value);

        return [
            'id' => $u->id,
            'name' => $u->name,
            'mobile' => $u->mobile,
            'email' => $u->email,
            'avatar' => $u->avatar ? (str_starts_with($u->avatar, 'http') || str_starts_with($u->avatar, 'data:') ? $u->avatar : asset('storage/' . $u->avatar)) : null,
            'total_orders' => (int) ($u->customer_orders_count ?? $u->customerOrders()->count()),
            'total_spend' => (float) $delivered->sum('total_amount'),
            'last_order_date' => $u->customerOrders()->max('placed_at'),
            'status' => $this->statusLabel($u),
            'profile_completion_percentage' => $u->profile_completion_percentage,
            'city' => $u->addresses->first()?->city,
        ];
    }

    protected function addressRow($a): array
    {
        return [
            'id' => $a->id,
            'type' => $a->type?->value ?? (string) $a->type,
            'address' => trim(($a->address_line1 ?? '').', '.($a->city ?? '')),
            'is_default' => (bool) $a->is_default,
            'latitude' => $a->latitude ? (float) $a->latitude : null,
            'longitude' => $a->longitude ? (float) $a->longitude : null,
        ];
    }

    protected function statusLabel(User $u): string
    {
        return $u->status === AccountStatus::ACTIVE ? 'ACTIVE' : 'BLOCKED';
    }
}
