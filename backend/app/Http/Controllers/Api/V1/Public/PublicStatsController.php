<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

/**
 * Public marketing data for the landing page — 100% real numbers from the DB.
 * No hardcoded/fabricated stats or testimonials.
 */
class PublicStatsController extends Controller
{
    public function stats(): JsonResponse
    {
        $customers = User::whereHas('roles', fn (Builder $q) => $q->where('slug', UserRole::CUSTOMER->value))->count();
        $restaurants = Restaurant::where('is_active', true)->count();
        $ordersDelivered = Order::where('status', OrderStatus::DELIVERED->value)->count();
        $cities = Restaurant::whereNotNull('city')->where('city', '!=', '')->distinct()->count('city');

        return ApiResponse::success([
            'customers' => $customers,
            'restaurants' => $restaurants,
            'orders_delivered' => $ordersDelivered,
            'cities' => $cities,
        ], 'Platform statistics retrieved.');
    }

    public function testimonials(): JsonResponse
    {
        $reviews = Review::query()
            ->where('is_visible', true)
            ->whereNotNull('comment')
            ->where('comment', '!=', '')
            ->where(function ($q) {
                $q->where('food_rating', '>=', 4)->orWhere('delivery_rating', '>=', 4);
            })
            ->with(['customer:id,name', 'restaurant:id,name,city'])
            ->latest('id')
            ->limit(6)
            ->get();

        $data = $reviews->map(fn ($r) => [
            'id' => $r->id,
            'name' => $r->customer?->name ?: 'Dastak Customer',
            'role' => 'Verified Customer'.($r->restaurant?->city ? ', '.$r->restaurant->city : ''),
            'text' => $r->comment,
            'rating' => (int) max($r->food_rating ?? 0, $r->delivery_rating ?? 0),
        ])->values();

        return ApiResponse::success($data, 'Testimonials retrieved.');
    }
}
