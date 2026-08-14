<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PayoutMethod;
use App\Enums\SettlementStatus;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\RestaurantSettlement;
use App\Models\SettlementOrder;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SettlementService
{
    public function generateSettlement(int $restaurantId, string $startDate, string $endDate): RestaurantSettlement
    {
        $restaurant = Restaurant::findOrFail($restaurantId);

        // Find delivered orders in period not yet in any settlement
        $orders = Order::where('restaurant_id', $restaurantId)
            ->where('status', OrderStatus::DELIVERED)
            ->whereBetween('placed_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->whereDoesntHave('settlementOrders')
            ->get();

        if ($orders->isEmpty()) {
            throw ValidationException::withMessages([
                'orders' => ['No unsettled delivered orders found for this restaurant in the selected date range.'],
            ]);
        }

        return DB::transaction(function () use ($restaurant, $orders, $startDate, $endDate) {
            $settlementNumber = 'SET-' . date('Ymd') . '-' . strtoupper(Str::random(5));

            $grossSales = $orders->sum('subtotal');
            $totalCommission = $orders->sum('commission_amount');
            $totalTax = $orders->sum('tax_amount');
            $netPayable = $orders->sum('restaurant_payout_amount');

            $settlement = RestaurantSettlement::create([
                'settlement_number' => $settlementNumber,
                'restaurant_id' => $restaurant->id,
                'period_start' => $startDate,
                'period_end' => $endDate,
                'total_orders_count' => $orders->count(),
                'gross_sales' => $grossSales,
                'platform_commission' => $totalCommission,
                'tax_deducted' => $totalTax,
                'net_payable' => $netPayable,
                'status' => SettlementStatus::PENDING,
            ]);

            foreach ($orders as $order) {
                SettlementOrder::create([
                    'settlement_id' => $settlement->id,
                    'order_id' => $order->id,
                    'order_amount' => $order->subtotal,
                    'commission_amount' => $order->commission_amount,
                    'payout_amount' => $order->restaurant_payout_amount,
                ]);
            }

            return $settlement->fresh(['restaurant', 'settlementOrders.order']);
        });
    }

    public function processPayout(
        RestaurantSettlement $settlement,
        User $admin,
        string $payoutMethod,
        string $reference,
        ?string $notes = null
    ): RestaurantSettlement {
        if ($settlement->status === SettlementStatus::PAID) {
            throw ValidationException::withMessages([
                'settlement' => ['This settlement has already been settled and marked paid.'],
            ]);
        }

        $settlement->update([
            'status' => SettlementStatus::PAID,
            'payout_method' => PayoutMethod::from($payoutMethod),
            'payout_reference' => $reference,
            'paid_at' => now(),
            'processed_by' => $admin->id,
            'notes' => $notes,
        ]);

        return $settlement->fresh(['restaurant', 'processedByAdmin']);
    }
}
