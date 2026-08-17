<?php

namespace App\Http\Resources\Admin;

use App\Enums\OrderStatus;
use App\Support\AdminOrderMap;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full order shape consumed by src/pages/orders/OrderDetailsDrawer.jsx.
 * Provides customer / restaurant / delivery / items / pricing / business_summary / timeline.
 */
class AdminOrderDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $addr = is_array($this->delivery_address_json) ? $this->delivery_address_json : [];

        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'created_at' => ($this->placed_at ?? $this->created_at)?->toIso8601String(),
            'status' => AdminOrderMap::statusToFrontend($this->status),
            'payment_method' => AdminOrderMap::paymentToFrontend($this->payment_mode),
            'payment_status' => $this->payment_status?->value ?? (string) $this->payment_status,

            'customer' => [
                'name' => $this->customer?->name ?? ($addr['contact_name'] ?? 'Guest'),
                'mobile' => $this->customer?->mobile ?? ($addr['contact_mobile'] ?? null),
                'address' => $addr['address_line1'] ?? $addr['line1'] ?? $addr['address'] ?? null,
                'landmark' => $addr['landmark'] ?? null,
                'city' => $addr['city'] ?? null,
            ],

            'restaurant' => [
                'id' => $this->restaurant?->id,
                'name' => $this->restaurant?->name,
                'address' => $this->restaurant?->address_line1,
                'mobile' => $this->restaurant?->phone,
                'commission_rate' => (float) ($this->commission_rate ?? $this->restaurant?->commission_rate ?? 0),
            ],

            'delivery' => [
                'delivery_boy_id' => $this->deliveryBoy?->id,
                'delivery_boy_name' => $this->deliveryBoy?->name,
                'mobile' => $this->deliveryBoy?->mobile,
                'assignment_type' => $this->deliveryBoy ? 'AUTO' : null,
                'distance_km' => null,
                'pickup_time' => $this->dispatched_at?->toIso8601String(),
                'delivery_time' => $this->delivered_at?->toIso8601String(),
            ],

            'items' => $this->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->item_name,
                    'variant' => $item->variant_name,
                    'addons' => $item->relationLoaded('addons')
                        ? $item->addons->pluck('addon_name')->filter()->values()->all()
                        : [],
                    'quantity' => (int) $item->quantity,
                    'price' => (float) $item->unit_price,
                    'total' => (float) $item->total_price,
                ];
            })->values(),

            'pricing' => [
                'subtotal' => (float) $this->subtotal,
                'discount' => (float) $this->discount_amount,
                'delivery_charge' => (float) $this->delivery_fee,
                'tax' => (float) $this->tax_amount,
                'final_amount' => (float) $this->total_amount,
            ],

            'business_summary' => [
                'restaurant_commission' => (float) $this->commission_amount,
                'delivery_boy_earning' => (float) $this->delivery_fee,
                'dastak_net_earning' => (float) $this->commission_amount,
                'settlement_status' => $this->settlementOrders()->exists() ? 'SETTLED' : 'PENDING',
            ],

            'timeline' => $this->buildTimeline(),
        ];
    }

    protected function buildTimeline(): array
    {
        $isCancelled = in_array($this->status, [OrderStatus::CANCELLED, OrderStatus::REJECTED, OrderStatus::FAILED], true);

        $steps = [
            ['title' => 'Order Placed', 'ts' => $this->placed_at, 'description' => 'Order received'],
            ['title' => 'Restaurant Accepted', 'ts' => $this->confirmed_at, 'description' => 'Confirmed by restaurant'],
            ['title' => 'Food Preparing', 'ts' => $this->preparing_at, 'description' => 'Kitchen is preparing the order'],
            ['title' => 'Food Ready for Pickup', 'ts' => $this->ready_at, 'description' => 'Awaiting rider pickup'],
            ['title' => 'Out for Delivery', 'ts' => $this->dispatched_at, 'description' => 'En route to customer'],
            ['title' => 'Delivered', 'ts' => $this->delivered_at, 'description' => 'Customer doorstep delivery'],
        ];

        // Index of the latest completed step (used to flag "current").
        $lastDone = -1;
        foreach ($steps as $i => $s) {
            if ($s['ts'] !== null) {
                $lastDone = $i;
            }
        }

        $timeline = [];
        foreach ($steps as $i => $s) {
            if ($s['ts'] !== null) {
                $status = ($i === $lastDone && ! $isCancelled && $this->status !== OrderStatus::DELIVERED)
                    ? 'current'
                    : 'completed';
            } else {
                $status = 'upcoming';
            }

            $timeline[] = [
                'title' => $s['title'],
                'timestamp' => $s['ts']?->toIso8601String(),
                'status' => $status,
                'description' => $s['description'],
            ];
        }

        if ($isCancelled) {
            $timeline[] = [
                'title' => $this->status === OrderStatus::REJECTED ? 'Rejected' : 'Cancelled',
                'timestamp' => $this->cancelled_at?->toIso8601String(),
                'status' => 'completed',
                'description' => $this->cancellation_reason ?? 'Order was cancelled',
            ];
        }

        return $timeline;
    }
}
