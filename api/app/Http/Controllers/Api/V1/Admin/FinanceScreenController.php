<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\OrderStatus;
use App\Enums\SettlementStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Models\Order;
use App\Models\Refund;
use App\Models\Restaurant;
use App\Models\RestaurantSettlement;
use App\Services\SettlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Backs the admin Finance screen (src/pages/finance/FinanceDashboard.jsx) under
 * /admin/finance/*: summary KPIs, restaurant settlements, and commission rates.
 */
class FinanceScreenController extends Controller
{
    public function __construct(protected SettlementService $settlementService) {}

    public function summary(): JsonResponse
    {
        $delivered = fn () => Order::where('status', OrderStatus::DELIVERED->value);

        $pendingSettlements = RestaurantSettlement::where('status', SettlementStatus::PENDING->value);

        return ApiResponse::success([
            'gross_sales' => (float) $delivered()->sum('total_amount'),
            'dastak_commission' => (float) $delivered()->sum('commission_amount'),
            'delivery_charges_collected' => (float) $delivered()->sum('delivery_fee'),
            'restaurant_payable' => (float) $delivered()->sum('restaurant_payout_amount'),
            'delivery_boy_payouts' => (float) $delivered()->sum('delivery_fee'),
            'cod_collected' => (float) $delivered()->where('payment_mode', 'COD')->sum('total_amount'),
            'online_payments' => (float) $delivered()->where('payment_mode', '!=', 'COD')->sum('total_amount'),
            'refunds_processed' => (float) Refund::where('status', 'PROCESSED')->sum('amount'),
            'pending_settlements_count' => (int) $pendingSettlements->count(),
            'pending_settlements_amount' => (float) (clone $pendingSettlements)->sum('net_payable'),
        ], 'Finance summary retrieved.');
    }

    public function settlements(Request $request): JsonResponse
    {
        $settlements = RestaurantSettlement::with('restaurant')->latest('id')->get();

        $rows = $settlements->map(fn ($s) => [
            'id' => $s->id,
            'settlement_number' => $s->settlement_number,
            'restaurant_name' => $s->restaurant?->name,
            'period' => $s->period_start && $s->period_end
                ? $s->period_start->format('d M').' - '.$s->period_end->format('d M Y')
                : null,
            'orders_count' => (int) $s->total_orders_count,
            'gross_sales' => (float) $s->gross_sales,
            'commission_deducted' => (float) $s->platform_commission,
            'adjustments' => -1 * (float) $s->tax_deducted,
            'payable_amount' => (float) $s->net_payable,
            'settlement_cycle' => $s->restaurant?->settlement_cycle ?? 'WEEKLY',
            'status' => $s->status === SettlementStatus::PAID ? 'SETTLED' : 'PENDING',
            'settlement_date' => ($s->paid_at ?? $s->period_end)?->toDateString(),
        ])->values();

        return ApiResponse::success($rows, 'Restaurant settlements retrieved.');
    }

    public function processSettlement(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'reference' => ['required', 'string', 'max:100'],
            'amount' => ['nullable', 'numeric'],
        ]);

        $settlement = RestaurantSettlement::findOrFail($id);

        $this->settlementService->processPayout(
            settlement: $settlement,
            admin: $request->user(),
            payoutMethod: 'BANK_TRANSFER',
            reference: $request->input('reference'),
            notes: 'Processed via admin finance screen.'
        );

        return ApiResponse::success(
            ['id' => $settlement->id, 'status' => 'SETTLED'],
            'Settlement processed and marked as paid.'
        );
    }

    public function commissions(): JsonResponse
    {
        $rows = Restaurant::with('owner')->orderBy('name')->get()->map(fn ($r) => [
            'id' => $r->id,
            'restaurant_name' => $r->name,
            'commission' => (float) $r->commission_rate,
            'effective_from' => $r->updated_at?->toDateString(),
            'status' => $r->is_active ? 'ACTIVE' : 'SUSPENDED',
        ])->values();

        return ApiResponse::success($rows, 'Restaurant commissions retrieved.');
    }

    public function updateCommission(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'commission' => ['required', 'numeric', 'between:0,100'],
        ]);

        $restaurant = Restaurant::findOrFail($id);
        $restaurant->update(['commission_rate' => $data['commission']]);

        return ApiResponse::success(
            ['id' => $restaurant->id, 'commission' => (float) $restaurant->commission_rate],
            'Commission rate updated. Applies to future orders only.'
        );
    }

    public function refunds(Request $request): JsonResponse
    {
        $rows = Refund::with('order')->latest('id')->get()->map(fn ($r) => [
            'id' => $r->id,
            'order_id' => $r->order?->order_number,
            'amount' => (float) $r->amount,
            'reason' => $r->reason,
            'status' => $r->status?->value ?? (string) $r->status,
            'created_at' => $r->created_at?->toIso8601String(),
        ])->values();

        return ApiResponse::success($rows, 'Refunds retrieved.');
    }

    public function codReports(): JsonResponse
    {
        $codDelivered = Order::where('status', OrderStatus::DELIVERED->value)->where('payment_mode', 'COD');

        return ApiResponse::success([
            'total_cod_orders' => (int) (clone $codDelivered)->count(),
            'total_cod_collected' => (float) (clone $codDelivered)->sum('total_amount'),
        ], 'COD report retrieved.');
    }

    public function deliveryChargeRules(): JsonResponse
    {
        if (\App\Models\DeliveryChargeRule::count() === 0) {
            $this->seedDefaultDeliveryRules();
        }

        $rules = \App\Models\DeliveryChargeRule::orderBy('sort_order')->orderBy('id')->get()->map(fn ($r) => [
            'id' => $r->id,
            'type' => $r->type,
            'min_km' => $r->min_km !== null ? (float) $r->min_km : null,
            'max_km' => $r->max_km !== null ? (float) $r->max_km : null,
            'min_order' => $r->min_order !== null ? (float) $r->min_order : null,
            'fee' => (float) $r->fee,
            'is_active' => (bool) $r->is_active,
        ])->values();

        return ApiResponse::success($rules, 'Delivery charge rules retrieved.');
    }

    public function updateDeliveryChargeRules(Request $request): JsonResponse
    {
        $rules = $request->input('rules', []);

        foreach ($rules as $rule) {
            $attrs = [
                'type' => $rule['type'] ?? 'Custom Tier',
                'min_km' => $rule['min_km'] ?? null,
                'max_km' => $rule['max_km'] ?? null,
                'min_order' => $rule['min_order'] ?? null,
                'fee' => $rule['fee'] ?? 0,
                'is_active' => $rule['is_active'] ?? true,
            ];

            if (! empty($rule['id'])) {
                \App\Models\DeliveryChargeRule::where('id', $rule['id'])->update($attrs);
            } else {
                \App\Models\DeliveryChargeRule::create($attrs);
            }
        }

        return $this->deliveryChargeRules();
    }

    protected function seedDefaultDeliveryRules(): void
    {
        $base = (float) config('dastak.delivery.base_fee', 35);
        $defaults = [
            ['type' => 'Distance Tier 1', 'min_km' => 0, 'max_km' => 4, 'fee' => $base, 'sort_order' => 1],
            ['type' => 'Distance Tier 2', 'min_km' => 4, 'max_km' => 8, 'fee' => $base + 20, 'sort_order' => 2],
            ['type' => 'Distance Tier 3', 'min_km' => 8, 'max_km' => (int) config('dastak.delivery.max_radius_km', 12), 'fee' => $base + 50, 'sort_order' => 3],
            ['type' => 'Free Delivery', 'min_order' => 500, 'fee' => 0, 'sort_order' => 4],
        ];

        foreach ($defaults as $d) {
            \App\Models\DeliveryChargeRule::create($d);
        }
    }
}
