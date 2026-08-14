<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCouponRequest;
use App\Http\Requests\Admin\UpdateCouponRequest;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\CouponResource;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Coupon::with('restaurant')->latest();

        if (! empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where('code', 'like', "%{$search}%")
                ->orWhere('title', 'like', "%{$search}%");
        }

        if (isset($request->is_active)) {
            $query->where('is_active', (bool) $request->is_active);
        }

        $coupons = $query->paginate((int) $request->input('per_page', 15));

        return ApiResponse::paginated(
            paginator: $coupons,
            resourceClass: CouponResource::class,
            message: 'Coupons retrieved successfully.'
        );
    }

    public function store(StoreCouponRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['code'] = strtoupper(trim($data['code']));

        $coupon = Coupon::create($data);

        return ApiResponse::success(
            new CouponResource($coupon),
            'Coupon created successfully.',
            201
        );
    }

    public function show(Coupon $coupon): JsonResponse
    {
        return ApiResponse::success(
            new CouponResource($coupon->load('restaurant')),
            'Coupon details retrieved successfully.'
        );
    }

    public function update(UpdateCouponRequest $request, Coupon $coupon): JsonResponse
    {
        $data = $request->validated();
        if (isset($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
        }

        $coupon->update($data);

        return ApiResponse::success(
            new CouponResource($coupon->fresh('restaurant')),
            'Coupon updated successfully.'
        );
    }

    public function destroy(Coupon $coupon): JsonResponse
    {
        $coupon->delete();

        return ApiResponse::success(null, 'Coupon deleted successfully.');
    }
}
