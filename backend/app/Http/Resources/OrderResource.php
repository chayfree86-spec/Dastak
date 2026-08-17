<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $isCustomer = $user && $user->id === $this->customer_id;
        $isAdmin = $user && $user->hasRole('super_admin');

        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status?->value ?? (string) $this->status,
            'status_label' => $this->status?->label() ?? 'Unknown',
            'is_final' => $this->status?->isFinal() ?? false,
            'can_cancel' => $this->canBeCancelledByCustomer(),
            'cancel_window_minutes' => (int) config('dastak.orders.cancel_window_minutes', 5),
            'cancel_window_seconds' => (int) config('dastak.orders.cancel_window_minutes', 5) * 60,
            'payment_status' => $this->payment_status?->value ?? (string) $this->payment_status,
            'payment_mode' => $this->payment_mode?->value ?? (string) $this->payment_mode,

            // Delivery OTP (Only revealed to Customer & Admin)
            'delivery_otp' => ($isCustomer || $isAdmin) ? $this->delivery_otp : null,

            'estimated_delivery_minutes' => (int) $this->estimated_delivery_minutes,
            'special_instructions' => $this->special_instructions,

            // Bill Breakdown
            'bill' => [
                'subtotal' => (float) $this->subtotal,
                'discount_amount' => (float) $this->discount_amount,
                'delivery_fee' => (float) $this->delivery_fee,
                'tax_amount' => (float) $this->tax_amount,
                'total_amount' => (float) $this->total_amount,
                'commission_amount' => (float) $this->commission_amount,
                'restaurant_payout_amount' => (float) $this->restaurant_payout_amount,
            ],

            // Context Objects
            'customer' => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'mobile' => $this->customer?->mobile,
            ],
            'restaurant' => [
                'id' => $this->restaurant?->id,
                'name' => $this->restaurant?->name,
                'phone' => $this->restaurant?->phone,
                'address' => $this->restaurant?->address_line1,
                'latitude' => $this->restaurant?->latitude,
                'longitude' => $this->restaurant?->longitude,
            ],
            'delivery_boy' => $this->deliveryBoy ? [
                'id' => $this->deliveryBoy->id,
                'name' => $this->deliveryBoy->name,
                'mobile' => $this->deliveryBoy->mobile,
                'vehicle_type' => $this->deliveryBoy->deliveryProfile?->vehicle_type?->value,
                'current_latitude' => $this->deliveryBoy->deliveryProfile?->current_latitude,
                'current_longitude' => $this->deliveryBoy->deliveryProfile?->current_longitude,
            ] : null,

            'delivery_address' => $this->delivery_address_json,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'status_history' => OrderStatusHistoryResource::collection($this->whenLoaded('statusHistories')),

            // Timelines
            'timelines' => [
                'placed_at' => $this->placed_at?->toIso8601String(),
                'confirmed_at' => $this->confirmed_at?->toIso8601String(),
                'preparing_at' => $this->preparing_at?->toIso8601String(),
                'ready_at' => $this->ready_at?->toIso8601String(),
                'dispatched_at' => $this->dispatched_at?->toIso8601String(),
                'delivered_at' => $this->delivered_at?->toIso8601String(),
                'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            ],

            'cancellation_reason' => $this->cancellation_reason,
            'cancelled_by' => $this->cancelled_by,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
