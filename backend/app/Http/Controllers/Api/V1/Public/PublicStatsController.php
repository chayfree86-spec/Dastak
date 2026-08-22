<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\DeliveryFeeService;
use App\Services\StoreHoursService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

/**
 * Public marketing and config data — 100% real numbers from the DB.
 * No hardcoded/fabricated stats or testimonials.
 */
class PublicStatsController extends Controller
{
    /** Current ordering availability (open/closed + next opening time) + delivery pricing config. */
    public function serviceStatus(StoreHoursService $store, DeliveryFeeService $delivery): JsonResponse
    {
        $data = $store->status();
        $data['delivery'] = $delivery->config();

        return ApiResponse::success($data, 'Service status retrieved.');
    }

    public function config(): JsonResponse
    {
        $all = SystemSetting::getAllSettings();
        $defaults = [
            'app_name' => 'Dastak',
            'tagline' => 'Jo Chahiye, Ghar Par',
            'brand_logo_url' => '',
            'support_phone' => '9005271986',
            'customer_support_phone' => '9005271986',
            'partner_support_phone' => '9005271986',
            'rider_support_phone' => '9005271986',
            'support_whatsapp' => '9005271986',
            'support_email' => 'support@dastakdelivery.com',
            'cancel_window_mins' => 5,
            'cod_enabled' => true,
            'base_delivery_fee' => 35,
        ];
        $merged = array_merge($defaults, $all);

        return ApiResponse::success([
            'app_name' => $merged['app_name'] ?? 'Dastak',
            'tagline' => $merged['tagline'] ?? 'Jo Chahiye, Ghar Par',
            'brand_logo_url' => (string) ($merged['brand_logo_url'] ?? ''),
            'support_phone' => (string) ($merged['support_phone'] ?? '9005271986'),
            'customer_support_phone' => (string) ($merged['customer_support_phone'] ?? $merged['support_phone'] ?? '9005271986'),
            'partner_support_phone' => (string) ($merged['partner_support_phone'] ?? $merged['support_phone'] ?? '9005271986'),
            'rider_support_phone' => (string) ($merged['rider_support_phone'] ?? $merged['support_phone'] ?? '9005271986'),
            'support_whatsapp' => (string) ($merged['support_whatsapp'] ?? '9005271986'),
            'support_email' => (string) ($merged['support_email'] ?? 'support@dastakdelivery.com'),
            'cancel_window_mins' => (int) ($merged['cancel_window_mins'] ?? 5),
            'cod_enabled' => (bool) ($merged['cod_enabled'] ?? true),
            'base_delivery_fee' => (float) ($merged['base_delivery_fee'] ?? 35),
        ], 'Platform configuration retrieved.');
    }

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
