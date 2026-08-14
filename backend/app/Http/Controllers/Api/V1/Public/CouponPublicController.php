<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Http\Resources\CouponResource;
use App\Services\CouponService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponPublicController extends Controller
{
    public function __construct(
        protected CouponService $couponService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $restaurantId = $request->filled('restaurant_id') ? (int) $request->input('restaurant_id') : null;
        $coupons = $this->couponService->listPublicCoupons($restaurantId);

        return ApiResponse::success(
            CouponResource::collection($coupons),
            'Applicable promotional coupons retrieved.'
        );
    }
}
