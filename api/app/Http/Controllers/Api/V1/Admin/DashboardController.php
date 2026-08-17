<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\OrderStatus;
use App\Enums\SettlementStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminOrderListResource;
use App\Http\Resources\ApiResponse;
use App\Models\DeliveryBoyProfile;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\RestaurantSettlement;
use App\Support\AdminOrderMap;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Backs the admin Dashboard (src/pages/dashboard/Dashboard.jsx):
 * kpis, order-overview, live-operations, recent-orders, sales-analytics.
 */
class DashboardController extends Controller
{
    public function kpis(): JsonResponse
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();

        $todayOrders = Order::whereDate('placed_at', $today);
        $yesterdayOrders = Order::whereDate('placed_at', $yesterday);

        $todayOrdersCount = (clone $todayOrders)->count();
        $yesterdayOrdersCount = (clone $yesterdayOrders)->count();
        $todaySales = (float) (clone $todayOrders)->sum('total_amount');
        $yesterdaySales = (float) (clone $yesterdayOrders)->sum('total_amount');

        $activeStatuses = [
            OrderStatus::PENDING->value,
            OrderStatus::CONFIRMED->value,
            OrderStatus::PREPARING->value,
            OrderStatus::READY_FOR_PICKUP->value,
            OrderStatus::OUT_FOR_DELIVERY->value,
        ];

        return ApiResponse::success([
            'today_orders' => $todayOrdersCount,
            'today_sales' => $todaySales,
            'active_orders' => Order::whereIn('status', $activeStatuses)->count(),
            'active_restaurants' => Restaurant::where('is_active', true)->count(),
            'delivery_boys_online' => DeliveryBoyProfile::where('is_online', true)->count(),
            'today_commission' => (float) (clone $todayOrders)->where('status', OrderStatus::DELIVERED->value)->sum('commission_amount'),
            'cod_collection' => (float) (clone $todayOrders)->where('payment_mode', 'COD')->where('status', OrderStatus::DELIVERED->value)->sum('total_amount'),
            'pending_settlements' => (float) RestaurantSettlement::where('status', SettlementStatus::PENDING->value)->sum('net_payable'),
            'today_orders_growth' => $this->growth($todayOrdersCount, $yesterdayOrdersCount),
            'today_sales_growth' => $this->growth($todaySales, $yesterdaySales),
        ], 'Dashboard KPIs retrieved.');
    }

    public function orderOverview(): JsonResponse
    {
        $counts = Order::query()
            ->selectRaw('status, COUNT(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status');

        $get = fn (OrderStatus $s) => (int) ($counts[$s->value] ?? 0);

        return ApiResponse::success([
            'NEW' => $get(OrderStatus::PENDING),
            'ACCEPTED' => $get(OrderStatus::CONFIRMED),
            'PREPARING' => $get(OrderStatus::PREPARING),
            'READY' => $get(OrderStatus::READY_FOR_PICKUP),
            // No dedicated ASSIGNED / PICKED_UP backend states.
            'ASSIGNED' => 0,
            'PICKED_UP' => 0,
            'OUT_FOR_DELIVERY' => $get(OrderStatus::OUT_FOR_DELIVERY),
            'DELIVERED' => $get(OrderStatus::DELIVERED),
            'CANCELLED' => $get(OrderStatus::CANCELLED),
            'REJECTED' => $get(OrderStatus::REJECTED),
        ], 'Order pipeline overview retrieved.');
    }

    public function liveOperations(): JsonResponse
    {
        return ApiResponse::success([
            'restaurants_online' => Restaurant::where('is_active', true)->where('is_open', true)->count(),
            'total_restaurants' => Restaurant::where('is_active', true)->count(),
            'riders_online' => DeliveryBoyProfile::where('is_online', true)->count(),
            'total_riders' => DeliveryBoyProfile::count(),
            'active_deliveries' => Order::where('status', OrderStatus::OUT_FOR_DELIVERY->value)->count(),
        ], 'Live operations retrieved.');
    }

    public function recentOrders(Request $request): JsonResponse
    {
        $limit = (int) $request->input('limit', 8);

        $orders = Order::with(['customer', 'restaurant', 'deliveryBoy'])
            ->latest('placed_at')
            ->limit($limit)
            ->get();

        // Reuse the list resource then remap the two differing keys the dashboard uses.
        $rows = $orders->map(fn ($o) => [
            'id' => $o->id,
            'customer_name' => $o->customer?->name ?? 'Guest',
            'restaurant_name' => $o->restaurant?->name ?? '—',
            'amount' => (float) $o->total_amount,
            'payment_method' => AdminOrderMap::paymentToFrontend($o->payment_mode),
            'status' => AdminOrderMap::statusToFrontend($o->status),
            'delivery_boy' => $o->deliveryBoy?->name ?? 'Unassigned',
            'time' => ($o->placed_at ?? $o->created_at)?->toIso8601String(),
        ])->values();

        return ApiResponse::success($rows, 'Recent orders retrieved.');
    }

    public function salesAnalytics(Request $request): JsonResponse
    {
        $days = (int) $request->input('days', 7);
        $start = Carbon::today()->subDays($days - 1);

        $orders = Order::whereBetween('placed_at', [$start->toDateTimeString(), Carbon::now()->endOfDay()->toDateTimeString()])->get();
        $byDate = $orders->groupBy(fn ($o) => ($o->placed_at ?? $o->created_at)->toDateString());

        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $start->copy()->addDays($i)->toDateString();
            $dayOrders = $byDate->get($date, collect());
            $series[] = [
                'date' => $date,
                'orders' => $dayOrders->count(),
                'sales' => (float) $dayOrders->sum('total_amount'),
            ];
        }

        return ApiResponse::success($series, 'Sales analytics retrieved.');
    }

    protected function growth(float $current, float $previous): float
    {
        if ($previous <= 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }
}
