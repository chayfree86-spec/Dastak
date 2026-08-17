<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\AccountStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminOrderListResource;
use App\Http\Resources\Admin\AdminRestaurantDetailResource;
use App\Http\Resources\Admin\AdminRestaurantListResource;
use App\Http\Resources\ApiResponse;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\User;
use App\Services\OrderService;
use App\Services\RestaurantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RestaurantAdminController extends Controller
{
    public function __construct(
        protected RestaurantService $restaurantService,
        protected OrderService $orderService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Restaurant::with('owner')->withCount('orders');

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%")
                    ->orWhereHas('owner', fn ($oq) => $oq->where('name', 'like', "%{$s}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('is_active', strtoupper($request->input('status')) === 'ACTIVE');
        }

        $paginator = $query->latest('id')->paginate((int) $request->input('per_page', 10));

        return ApiResponse::paginated(
            paginator: $paginator,
            resourceClass: AdminRestaurantListResource::class,
            message: 'Restaurants directory retrieved successfully.'
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'owner_name' => ['required', 'string', 'max:150'],
            'mobile' => ['required', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:150'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'commission' => ['nullable', 'numeric', 'between:0,100'],
            'settlement_cycle' => ['nullable', 'string', 'in:DAILY,WEEKLY,MONTHLY'],
            'min_order' => ['nullable', 'numeric', 'min:0'],
            'delivery_radius_km' => ['nullable', 'numeric', 'min:0'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'status' => ['nullable', 'string'],
            'is_veg_only' => ['nullable', 'boolean'],
        ]);

        $owner = $this->resolveOwner($validated);

        $restaurant = $this->restaurantService->createRestaurant($owner, $this->mapRestaurantData($validated, true));

        return ApiResponse::success(
            new AdminRestaurantDetailResource($restaurant->fresh(['owner', 'operatingHours'])),
            'Restaurant created and onboarded successfully.',
            201
        );
    }

    public function show(int $id): JsonResponse
    {
        $restaurant = Restaurant::with(['owner', 'zone', 'operatingHours', 'bankAccount'])->findOrFail($id);

        return ApiResponse::success(
            new AdminRestaurantDetailResource($restaurant),
            'Restaurant details retrieved successfully.'
        );
    }

    public function update(Request $request, Restaurant $restaurant): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'owner_name' => ['sometimes', 'string', 'max:150'],
            'owner_email' => ['nullable', 'email', 'max:150', 'unique:users,email,'.($restaurant->owner?->id ?? 0)],
            'owner_mobile' => ['nullable', 'string', 'max:20', 'unique:users,mobile,'.($restaurant->owner?->id ?? 0)],
            'owner_status' => ['nullable', 'string', 'in:ACTIVE,SUSPENDED'],
            'password' => ['nullable', 'string', 'min:6'],
            'login_pin' => ['nullable', 'string', 'regex:/^\d{4,6}$/'],
            'mobile' => ['sometimes', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:150'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'commission' => ['nullable', 'numeric', 'between:0,100'],
            'settlement_cycle' => ['nullable', 'string', 'in:DAILY,WEEKLY,MONTHLY'],
            'min_order' => ['nullable', 'numeric', 'min:0'],
            'delivery_radius_km' => ['nullable', 'numeric', 'min:0'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'status' => ['nullable', 'string'],
            'is_veg_only' => ['nullable', 'boolean'],
        ]);

        $updated = $this->restaurantService->updateRestaurant($restaurant, $this->mapRestaurantData($validated, false));

        $userUpdate = [];
        if (! empty($validated['owner_name'])) {
            $userUpdate['name'] = $validated['owner_name'];
        }
        if ($request->filled('owner_email')) {
            $userUpdate['email'] = $validated['owner_email'];
        }
        if ($request->filled('owner_mobile')) {
            $userUpdate['mobile'] = $validated['owner_mobile'];
        }
        if ($request->filled('owner_status')) {
            $userUpdate['status'] = $validated['owner_status'];
        }
        if ($request->filled('password')) {
            $userUpdate['password'] = Hash::make($validated['password']);
        }
        if ($request->filled('login_pin')) {
            $userUpdate['login_pin'] = Hash::make($validated['login_pin']);
        }

        if (! empty($userUpdate) && $restaurant->owner) {
            $restaurant->owner->update($userUpdate);
        }

        return ApiResponse::success(
            new AdminRestaurantDetailResource($updated->fresh(['owner', 'operatingHours'])),
            'Restaurant updated successfully.'
        );
    }

    public function updateStatus(Request $request, Restaurant $restaurant): JsonResponse
    {
        // The UI reuses this endpoint for both suspend/activate and open/close toggles.
        if ($request->has('is_online')) {
            $restaurant->update(['is_open' => (bool) $request->input('is_online')]);
        }

        if ($request->filled('status')) {
            $this->restaurantService->updateRestaurantStatus(
                $restaurant,
                strtoupper($request->input('status')) === 'ACTIVE'
            );
        }

        return ApiResponse::success(
            new AdminRestaurantDetailResource($restaurant->fresh(['owner', 'operatingHours'])),
            'Restaurant status updated.'
        );
    }

    public function updateOperatingHours(Request $request, int $id): JsonResponse
    {
        $restaurant = Restaurant::findOrFail($id);
        $data = $request->validate([
            'hours' => ['required', 'array', 'min:1', 'max:7'],
            'hours.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'hours.*.opening_time' => ['required', 'string'],
            'hours.*.closing_time' => ['required', 'string'],
            'hours.*.is_closed' => ['nullable', 'boolean'],
        ]);

        $this->restaurantService->updateOperatingHours($restaurant, $data['hours']);

        return ApiResponse::success(
            new AdminRestaurantDetailResource($restaurant->fresh(['owner', 'operatingHours'])),
            'Operating hours updated successfully.'
        );
    }

    public function getMenu(int $id): JsonResponse
    {
        $categories = MenuCategory::where('restaurant_id', $id)
            ->with(['items.variantGroups.variants', 'items.addonGroups.addons'])
            ->orderBy('sort_order')
            ->get();

        $menu = $categories->map(fn ($cat) => [
            'category' => $cat->name,
            'items' => $cat->items->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'is_veg' => $item->food_type?->value === 'VEG',
                'price' => (float) $item->base_price,
                'discount_price' => $item->discount_price !== null ? (float) $item->discount_price : (float) $item->base_price,
                'is_available' => (bool) $item->is_available,
                'prep_time' => ($item->preparation_time_minutes ?? 20).' mins',
                'variants' => $item->variantGroups->flatMap->variants->pluck('name')->values()->all(),
                'addons' => $item->addonGroups->flatMap->addons->pluck('name')->values()->all(),
            ])->values(),
        ])->values();

        return ApiResponse::success($menu, 'Restaurant menu retrieved.');
    }

    public function getOrders(Request $request, int $id): JsonResponse
    {
        $orders = $this->orderService->listOrders(
            filters: ['restaurant_id' => $id],
            perPage: (int) $request->input('limit', $request->input('per_page', 10))
        );

        return ApiResponse::paginated(
            paginator: $orders,
            resourceClass: AdminOrderListResource::class,
            message: 'Restaurant orders retrieved.'
        );
    }

    public function getSettlements(int $id): JsonResponse
    {
        $restaurant = Restaurant::with('settlements')->findOrFail($id);

        $settlements = $restaurant->settlements->map(fn ($s) => [
            'id' => $s->id,
            'reference' => $s->reference_number ?? ('STL-'.$s->id),
            'amount' => (float) ($s->net_payable_amount ?? $s->total_payout_amount ?? 0),
            'status' => $s->status?->value ?? (string) $s->status,
            'period' => $s->period_start && $s->period_end
                ? $s->period_start->format('d M').' - '.$s->period_end->format('d M Y')
                : null,
            'created_at' => $s->created_at?->toIso8601String(),
        ])->values();

        return ApiResponse::success($settlements, 'Restaurant settlements retrieved.');
    }

    public function getEarnings(int $id): JsonResponse
    {
        $restaurant = Restaurant::findOrFail($id);
        $delivered = $restaurant->orders()->where('status', 'DELIVERED');

        return ApiResponse::success([
            'lifetime_sales' => (float) $delivered->sum('total_amount'),
            'total_commission' => (float) $restaurant->orders()->where('status', 'DELIVERED')->sum('commission_amount'),
            'pending_settlement' => (float) $restaurant->orders()->where('status', 'DELIVERED')->sum('restaurant_payout_amount'),
        ], 'Restaurant earnings retrieved.');
    }

    public function storeMenuItem(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'category' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer'],
            'price' => ['required', 'numeric', 'min:0'],
            'discount_price' => ['nullable', 'numeric', 'min:0'],
            'is_veg' => ['nullable', 'boolean'],
            'is_available' => ['nullable', 'boolean'],
        ]);

        $categoryId = $data['category_id'] ?? MenuCategory::firstOrCreate(
            ['restaurant_id' => $id, 'name' => $data['category'] ?? 'General'],
            ['is_active' => true, 'sort_order' => 1]
        )->id;

        $item = MenuItem::create([
            'restaurant_id' => $id,
            'category_id' => $categoryId,
            'name' => $data['name'],
            'base_price' => $data['price'],
            'discount_price' => $data['discount_price'] ?? null,
            'food_type' => ($data['is_veg'] ?? false) ? 'VEG' : 'NON_VEG',
            'is_available' => $data['is_available'] ?? true,
        ]);

        return ApiResponse::success(['id' => $item->id], 'Menu item created.', 201);
    }

    public function updateMenuItem(Request $request, int $id, int $itemId): JsonResponse
    {
        $item = MenuItem::where('restaurant_id', $id)->findOrFail($itemId);

        $data = $request->only(['name', 'price', 'discount_price', 'is_available']);
        $update = array_filter([
            'name' => $data['name'] ?? null,
            'base_price' => $data['price'] ?? null,
            'discount_price' => $data['discount_price'] ?? null,
        ], fn ($v) => $v !== null);

        if ($request->has('is_available')) {
            $update['is_available'] = (bool) $request->input('is_available');
        }
        if ($request->has('is_veg')) {
            $update['food_type'] = $request->boolean('is_veg') ? 'VEG' : 'NON_VEG';
        }

        $item->update($update);

        return ApiResponse::success(['id' => $item->id], 'Menu item updated.');
    }

    public function toggleMenuItemAvailability(Request $request, int $id, int $itemId): JsonResponse
    {
        $item = MenuItem::where('restaurant_id', $id)->findOrFail($itemId);
        $item->update(['is_available' => (bool) $request->input('is_available', ! $item->is_available)]);

        return ApiResponse::success(
            ['id' => $item->id, 'is_available' => $item->is_available],
            'Menu item availability updated.'
        );
    }

    protected function resolveOwner(array $data): User
    {
        $owner = null;
        if (! empty($data['email'])) {
            $owner = User::where('email', $data['email'])->first();
        }
        if (! $owner && ! empty($data['mobile'])) {
            $owner = User::where('mobile', $data['mobile'])->first();
        }

        if (! $owner) {
            $owner = User::create([
                'name' => $data['owner_name'] ?? 'Restaurant Owner',
                'email' => $data['email'] ?? ('owner_'.Str::lower(Str::random(8)).'@dastak.local'),
                'mobile' => $data['mobile'] ?? null,
                'password' => Hash::make(Str::random(16)),
                'status' => AccountStatus::ACTIVE,
                'email_verified_at' => now(),
            ]);
            $owner->assignRole(UserRole::RESTAURANT);
        }

        return $owner;
    }

    protected function mapRestaurantData(array $v, bool $isCreate): array
    {
        $map = [];
        if (array_key_exists('name', $v)) $map['name'] = $v['name'];
        if (array_key_exists('mobile', $v)) $map['phone'] = $v['mobile'];
        if (array_key_exists('email', $v)) $map['email'] = $v['email'];
        if (array_key_exists('address', $v)) $map['address_line1'] = $v['address'] ?: 'N/A';
        if (array_key_exists('city', $v)) $map['city'] = $v['city'] ?: 'Kanpur';
        if (array_key_exists('commission', $v)) $map['commission_rate'] = $v['commission'];
        if (array_key_exists('settlement_cycle', $v) && $v['settlement_cycle']) $map['settlement_cycle'] = strtoupper($v['settlement_cycle']);
        if (array_key_exists('delivery_radius_km', $v) && $v['delivery_radius_km'] !== null) $map['delivery_radius_km'] = (int) $v['delivery_radius_km'];
        if (array_key_exists('min_order', $v)) $map['min_order_value'] = $v['min_order'];
        if (array_key_exists('is_veg_only', $v)) $map['is_pure_veg'] = (bool) $v['is_veg_only'];
        if (array_key_exists('status', $v)) $map['is_active'] = strtoupper((string) $v['status']) === 'ACTIVE';
        // Map coordinates on both create AND update (delivery-area map save relies on this).
        if (array_key_exists('latitude', $v) && $v['latitude'] !== null) $map['latitude'] = $v['latitude'];
        if (array_key_exists('longitude', $v) && $v['longitude'] !== null) $map['longitude'] = $v['longitude'];

        if ($isCreate) {
            // Backend requires these NOT NULL columns; the admin form may not collect them.
            $map['pincode'] ??= $v['pincode'] ?? '000000';
            $map['latitude'] ??= 26.4499;
            $map['longitude'] ??= 80.3319;
            $map['is_open'] ??= true;
            $map['address_line1'] ??= 'N/A';
            $map['city'] ??= 'Kanpur';
        }

        return $map;
    }
}
