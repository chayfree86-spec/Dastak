<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function getAdminDashboardSummary(): array
    {
        $today = now()->toDateString();

        // 1. Lifetime KPIs
        $totalGmv = (float) Order::where('status', OrderStatus::DELIVERED)->sum('total_amount');
        $totalCommission = (float) Order::where('status', OrderStatus::DELIVERED)->sum('commission_amount');
        $totalDeliveredOrders = Order::where('status', OrderStatus::DELIVERED)->count();
        $totalPendingOrders = Order::whereNotIn('status', [OrderStatus::DELIVERED, OrderStatus::CANCELLED, OrderStatus::REJECTED, OrderStatus::FAILED])->count();

        // 2. Active Platform Entities
        $activeRestaurants = Restaurant::where('is_active', true)->where('is_open', true)->count();
        $totalRestaurants = Restaurant::count();
        $onlineRiders = User::whereHas('roles', fn ($q) => $q->where('slug', UserRole::DELIVERY_BOY->value))
            ->whereHas('deliveryProfile', fn ($q) => $q->where('is_online', true))
            ->count();
        $totalCustomers = User::whereHas('roles', fn ($q) => $q->where('slug', UserRole::CUSTOMER->value))->count();

        // 3. Today's Performance
        $todaySales = (float) Order::whereDate('placed_at', $today)
            ->where('status', OrderStatus::DELIVERED)
            ->sum('total_amount');
        $todayOrdersCount = Order::whereDate('placed_at', $today)->count();
        $todayCommission = (float) Order::whereDate('placed_at', $today)
            ->where('status', OrderStatus::DELIVERED)
            ->sum('commission_amount');

        return [
            'kpis' => [
                'total_gmv' => round($totalGmv, 2),
                'total_platform_commission' => round($totalCommission, 2),
                'total_delivered_orders' => $totalDeliveredOrders,
                'active_pending_orders' => $totalPendingOrders,
            ],
            'today' => [
                'sales' => round($todaySales, 2),
                'orders_count' => $todayOrdersCount,
                'commission' => round($todayCommission, 2),
            ],
            'fleet_and_merchants' => [
                'active_open_restaurants' => $activeRestaurants,
                'total_restaurants' => $totalRestaurants,
                'online_delivery_riders' => $onlineRiders,
                'total_registered_customers' => $totalCustomers,
            ],
        ];
    }

    public function getAdminSalesChart(int $days = 30): array
    {
        $startDate = now()->subDays($days)->startOfDay();

        $dailyStats = Order::where('placed_at', '>=', $startDate)
            ->where('status', OrderStatus::DELIVERED)
            ->selectRaw('DATE(placed_at) as date, COUNT(id) as total_orders, SUM(total_amount) as total_sales, SUM(commission_amount) as total_commission')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return $dailyStats->map(fn ($row) => [
            'date' => $row->date,
            'orders' => (int) $row->total_orders,
            'sales' => round((float) $row->total_sales, 2),
            'commission' => round((float) $row->total_commission, 2),
        ])->toArray();
    }

    public function getTopPerformingEntities(): array
    {
        // Top 5 Restaurants by Order Volume
        $topRestaurants = Restaurant::withCount(['owner'])
            ->leftJoin('orders', 'restaurants.id', '=', 'orders.restaurant_id')
            ->where('orders.status', OrderStatus::DELIVERED->value)
            ->select('restaurants.id', 'restaurants.name', 'restaurants.slug', 'restaurants.rating', DB::raw('COUNT(orders.id) as orders_count'), DB::raw('SUM(orders.total_amount) as gross_revenue'))
            ->groupBy('restaurants.id', 'restaurants.name', 'restaurants.slug', 'restaurants.rating')
            ->orderByDesc('gross_revenue')
            ->limit(5)
            ->get();

        // Top 5 Best-Selling Menu Items
        $topItems = OrderItem::select('menu_item_id', 'item_name', DB::raw('SUM(quantity) as total_quantity_sold'), DB::raw('SUM(total_price) as total_sales_volume'))
            ->groupBy('menu_item_id', 'item_name')
            ->orderByDesc('total_quantity_sold')
            ->limit(5)
            ->get();

        return [
            'top_restaurants' => $topRestaurants,
            'top_menu_items' => $topItems,
        ];
    }

    public function getPartnerDashboardSummary(Restaurant $restaurant): array
    {
        $today = now()->toDateString();

        $totalSales = (float) Order::where('restaurant_id', $restaurant->id)
            ->where('status', OrderStatus::DELIVERED)
            ->sum('subtotal');

        $totalNetPayout = (float) Order::where('restaurant_id', $restaurant->id)
            ->where('status', OrderStatus::DELIVERED)
            ->sum('restaurant_payout_amount');

        $totalCommissionPaid = (float) Order::where('restaurant_id', $restaurant->id)
            ->where('status', OrderStatus::DELIVERED)
            ->sum('commission_amount');

        $deliveredOrders = Order::where('restaurant_id', $restaurant->id)
            ->where('status', OrderStatus::DELIVERED)
            ->count();

        $pendingOrders = Order::where('restaurant_id', $restaurant->id)
            ->whereIn('status', [OrderStatus::PENDING, OrderStatus::CONFIRMED, OrderStatus::PREPARING, OrderStatus::READY_FOR_PICKUP])
            ->count();

        $todaySales = (float) Order::where('restaurant_id', $restaurant->id)
            ->whereDate('placed_at', $today)
            ->where('status', OrderStatus::DELIVERED)
            ->sum('subtotal');

        $todayOrders = Order::where('restaurant_id', $restaurant->id)
            ->whereDate('placed_at', $today)
            ->count();

        $activePending = Order::where('restaurant_id', $restaurant->id)
            ->where('status', OrderStatus::PENDING)
            ->count();

        $activePreparing = Order::where('restaurant_id', $restaurant->id)
            ->whereIn('status', [OrderStatus::CONFIRMED, OrderStatus::PREPARING])
            ->count();

        $activeReady = Order::where('restaurant_id', $restaurant->id)
            ->where('status', OrderStatus::READY_FOR_PICKUP)
            ->count();

        return [
            'restaurant' => [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'is_open' => (bool) $restaurant->is_open,
                'rating' => (float) $restaurant->rating,
                'total_ratings' => (int) $restaurant->total_ratings,
            ],
            'kpis' => [
                'gross_sales' => round($totalSales, 2),
                'net_payout' => round($totalNetPayout, 2),
                'commission_paid' => round($totalCommissionPaid, 2),
                'delivered_orders_count' => $deliveredOrders,
                'active_kitchen_orders' => $pendingOrders,
                'new_pending_count' => $activePending,
                'preparing_count' => $activePreparing,
                'ready_count' => $activeReady,
            ],
            'today' => [
                'sales' => round($todaySales, 2),
                'orders_count' => $todayOrders,
            ],
        ];
    }

    public function getPartnerReports(Restaurant $restaurant, array $filters = []): array
    {
        $range = $filters['range'] ?? 'today';
        $now = now();

        switch ($range) {
            case 'yesterday':
                $start = $now->copy()->subDay()->startOfDay();
                $end = $now->copy()->subDay()->endOfDay();
                $label = 'Yesterday';
                break;
            case 'this_week':
                $start = $now->copy()->startOfWeek();
                $end = $now->copy()->endOfWeek();
                $label = 'This Week';
                break;
            case 'this_month':
                $start = $now->copy()->startOfMonth();
                $end = $now->copy()->endOfMonth();
                $label = 'This Month';
                break;
            case 'custom':
                $start = ! empty($filters['start_date']) ? \Carbon\Carbon::parse($filters['start_date'])->startOfDay() : $now->copy()->subDays(7)->startOfDay();
                $end = ! empty($filters['end_date']) ? \Carbon\Carbon::parse($filters['end_date'])->endOfDay() : $now->copy()->endOfDay();
                $label = 'Custom Range';
                break;
            case 'today':
            default:
                $start = $now->copy()->startOfDay();
                $end = $now->copy()->endOfDay();
                $label = 'Today';
                break;
        }

        $ordersQuery = Order::where('restaurant_id', $restaurant->id)
            ->whereBetween('placed_at', [$start, $end]);

        $totalOrdersCount = (clone $ordersQuery)->count();
        $deliveredQuery = (clone $ordersQuery)->where('status', OrderStatus::DELIVERED);
        $deliveredCount = (clone $deliveredQuery)->count();
        $cancelledCount = (clone $ordersQuery)->where('status', OrderStatus::CANCELLED)->count();
        $rejectedCount = (clone $ordersQuery)->where('status', OrderStatus::REJECTED)->count();

        $grossSales = (float) (clone $deliveredQuery)->sum('subtotal');
        $discountAmount = (float) (clone $deliveredQuery)->sum('discount_amount');
        $taxAmount = (float) (clone $deliveredQuery)->sum('tax_amount');
        $commissionAmount = (float) (clone $deliveredQuery)->sum('commission_amount');
        $netPayout = (float) (clone $deliveredQuery)->sum('restaurant_payout_amount');
        $avgOrderValue = $deliveredCount > 0 ? round($grossSales / $deliveredCount, 2) : 0.00;

        // Daily breakdown
        $daily = (clone $deliveredQuery)
            ->selectRaw('DATE(placed_at) as date, COUNT(id) as orders_count, SUM(subtotal) as sales, SUM(commission_amount) as commission, SUM(restaurant_payout_amount) as payout')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->map(fn ($r) => [
                'date' => $r->date,
                'orders_count' => (int) $r->orders_count,
                'sales' => round((float) $r->sales, 2),
                'commission' => round((float) $r->commission, 2),
                'payout' => round((float) $r->payout, 2),
            ])->toArray();

        // Top items in range
        $topItems = OrderItem::whereHas('order', function ($q) use ($restaurant, $start, $end) {
            $q->where('restaurant_id', $restaurant->id)
              ->whereBetween('placed_at', [$start, $end])
              ->where('status', OrderStatus::DELIVERED);
        })
        ->select('item_name', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(total_price) as total_amount'))
        ->groupBy('item_name')
        ->orderByDesc('total_qty')
        ->limit(6)
        ->get()
        ->map(fn ($it) => [
            'name' => $it->item_name,
            'quantity' => (int) $it->total_qty,
            'amount' => round((float) $it->total_amount, 2),
        ])->toArray();

        return [
            'period' => [
                'range' => $range,
                'label' => $label,
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
            ],
            'summary' => [
                'total_orders' => $totalOrdersCount,
                'delivered_orders' => $deliveredCount,
                'cancelled_orders' => $cancelledCount,
                'rejected_orders' => $rejectedCount,
                'gross_sales' => round($grossSales, 2),
                'discount_amount' => round($discountAmount, 2),
                'tax_amount' => round($taxAmount, 2),
                'platform_commission' => round($commissionAmount, 2),
                'net_restaurant_payout' => round($netPayout, 2),
                'average_order_value' => $avgOrderValue,
            ],
            'daily_breakdown' => $daily,
            'top_items' => $topItems,
        ];
    }

    public function getRiderSummary(User $rider): array
    {
        $profile = $rider->deliveryProfile;
        $today = now()->toDateString();

        $todayDeliveries = Order::where('delivery_boy_id', $rider->id)
            ->whereDate('delivered_at', $today)
            ->where('status', OrderStatus::DELIVERED)
            ->count();

        return [
            'rider' => [
                'id' => $rider->id,
                'name' => $rider->name,
                'is_online' => (bool) ($profile?->is_online ?? false),
                'is_busy' => (bool) ($profile?->is_busy ?? false),
                'rating' => (float) ($profile?->rating ?? 5.0),
                'total_ratings' => (int) ($profile?->total_ratings ?? 0),
            ],
            'earnings' => [
                'lifetime_deliveries' => (int) ($profile?->total_deliveries ?? 0),
                'today_deliveries' => $todayDeliveries,
                'pending_cod_cash' => (float) ($profile?->pending_cod_amount ?? 0.00),
                'total_earned' => (float) ($profile?->total_earned_amount ?? 0.00),
            ],
        ];
    }
}
