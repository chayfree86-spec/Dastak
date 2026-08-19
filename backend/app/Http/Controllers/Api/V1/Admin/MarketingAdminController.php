<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminCouponResource;
use App\Http\Resources\ApiResponse;
use App\Models\Banner;
use App\Models\Coupon;
use App\Models\PushNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Backs the admin Marketing screen (src/pages/marketing/CouponList.jsx) under
 * /admin/marketing/*. Maps the UI's flat coupon shape (FLAT type, start_date,
 * min_order, usage_limit ...) onto the backend Coupon columns.
 */
class MarketingAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Coupon::latest('id');

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where('code', 'like', "%{$s}%")->orWhere('title', 'like', "%{$s}%");
        }

        $coupons = $query->paginate((int) $request->input('per_page', 20));

        return ApiResponse::paginated(
            paginator: $coupons,
            resourceClass: AdminCouponResource::class,
            message: 'Coupons retrieved successfully.'
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request);
        $coupon = Coupon::create($this->mapCoupon($data, true));

        return ApiResponse::success(
            new AdminCouponResource($coupon),
            'Coupon created successfully.',
            201
        );
    }

    public function update(Request $request, Coupon $coupon): JsonResponse
    {
        $data = $this->validatePayload($request, false);
        $coupon->update($this->mapCoupon($data, false));

        return ApiResponse::success(
            new AdminCouponResource($coupon->fresh()),
            'Coupon updated successfully.'
        );
    }

    public function toggleStatus(Request $request, Coupon $coupon): JsonResponse
    {
        $coupon->update(['is_active' => (bool) $request->input('is_active', ! $coupon->is_active)]);

        return ApiResponse::success(
            new AdminCouponResource($coupon->fresh()),
            'Coupon status updated.'
        );
    }

    public function destroy(Coupon $coupon): JsonResponse
    {
        $coupon->delete();

        return ApiResponse::success(null, 'Coupon deleted successfully.');
    }

    // --- Promotional banners ---

    public function banners(): JsonResponse
    {
        $banners = Banner::orderBy('sort_order')->orderBy('id')->get()->map(fn ($b) => [
            'id' => $b->id,
            'title' => $b->title,
            'image_url' => $b->image_url,
            'link_url' => $b->link_url,
            'sort_order' => (int) $b->sort_order,
            'is_active' => (bool) $b->is_active,
        ])->values();

        return ApiResponse::success($banners, 'Banners retrieved.');
    }

    public function storeBanner(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'image_url' => ['nullable', 'string'],
            'link_url' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $banner = Banner::create($data);

        return ApiResponse::success(['id' => $banner->id], 'Banner created.', 201);
    }

    public function updateBanner(Request $request, int $id): JsonResponse
    {
        $banner = Banner::findOrFail($id);
        $banner->update($request->only(['title', 'image_url', 'link_url', 'sort_order', 'is_active']));

        return ApiResponse::success(['id' => $banner->id], 'Banner updated.');
    }

    public function destroyBanner(int $id): JsonResponse
    {
        Banner::findOrFail($id)->delete();

        return ApiResponse::success(null, 'Banner deleted.');
    }

    public function sendNotification(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'message' => ['nullable', 'string'],
            'audience' => ['nullable', 'string', 'max:50'],
        ]);

        // Logged/queued for broadcast; actual push-provider delivery is a separate integration.
        $log = PushNotification::create([
            'title' => $data['title'],
            'message' => $data['message'] ?? null,
            'audience' => strtoupper($data['audience'] ?? 'ALL'),
            'sent_by' => $request->user()?->id,
            'created_at' => now(),
        ]);

        return ApiResponse::success(['id' => $log->id], 'Push notification queued for broadcast.', 201);
    }

    protected function validatePayload(Request $request, bool $isCreate = true): array
    {
        return $request->validate([
            'code' => [$isCreate ? 'required' : 'sometimes', 'string', 'max:50'],
            'discount_type' => ['nullable', 'string', 'in:PERCENTAGE,FLAT,FIXED'],
            'discount_value' => [$isCreate ? 'required' : 'sometimes', 'numeric', 'min:0'],
            'min_order' => ['nullable', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'usage_limit' => ['nullable', 'integer', 'min:0'],
            'user_limit' => ['nullable', 'integer', 'min:0'],
            'image_url' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }

    protected function mapCoupon(array $v, bool $isCreate): array
    {
        $map = [];

        if (array_key_exists('code', $v)) {
            $map['code'] = strtoupper(trim($v['code']));
            $map['title'] = $map['code']; // migration requires a non-null title
        }
        if (array_key_exists('discount_type', $v)) {
            $map['discount_type'] = strtoupper($v['discount_type']) === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED';
        }
        if (array_key_exists('discount_value', $v)) $map['discount_value'] = $v['discount_value'];
        if (array_key_exists('min_order', $v)) $map['min_order_value'] = $v['min_order'];
        if (array_key_exists('max_discount', $v)) $map['max_discount_amount'] = $v['max_discount'];
        if (array_key_exists('start_date', $v)) $map['starts_at'] = $v['start_date'];
        if (array_key_exists('end_date', $v)) $map['expires_at'] = $v['end_date'];
        if (array_key_exists('usage_limit', $v)) $map['total_usage_limit'] = $v['usage_limit'];
        if (array_key_exists('user_limit', $v)) $map['usage_limit_per_user'] = $v['user_limit'];
        if (array_key_exists('image_url', $v)) $map['image_url'] = $v['image_url'];
        if (array_key_exists('is_active', $v)) $map['is_active'] = (bool) $v['is_active'];

        if ($isCreate) {
            $map['discount_type'] ??= 'PERCENTAGE';
            $map['is_active'] ??= true;
        }

        return $map;
    }
}
