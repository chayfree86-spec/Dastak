<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Events\RiderLocationUpdatedBroadcast;
use App\Models\Order;
use App\Models\RiderLocation;
use App\Models\User;

class TelemetryService
{
    public function recordRiderLocation(
        User $rider,
        float $latitude,
        float $longitude,
        ?float $heading = null,
        ?float $speed = null,
        ?int $activeOrderId = null
    ): RiderLocation {
        // 1. Update live fleet coordinates on rider profile
        if ($rider->deliveryProfile) {
            $rider->deliveryProfile->update([
                'current_latitude' => $latitude,
                'current_longitude' => $longitude,
                'last_location_updated_at' => now(),
            ]);
        }

        // 2. Resolve active order if passed
        $order = null;
        if ($activeOrderId) {
            $order = Order::find($activeOrderId);
        } else {
            // Find current active order assigned to rider
            $order = Order::where('delivery_boy_id', $rider->id)
                ->whereIn('status', [OrderStatus::PREPARING, OrderStatus::READY_FOR_PICKUP, OrderStatus::OUT_FOR_DELIVERY])
                ->latest('id')
                ->first();
        }

        // 3. Record historical breadcrumb location
        $location = RiderLocation::create([
            'user_id' => $rider->id,
            'order_id' => $order?->id,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'heading' => $heading,
            'speed' => $speed,
            'recorded_at' => now(),
        ]);

        // 4. Broadcast live WebSocket position
        event(new RiderLocationUpdatedBroadcast($location, $order?->order_number));

        return $location;
    }

    public function getOrderLiveTracking(Order $order): array
    {
        $rider = $order->deliveryBoy;
        $profile = $rider?->deliveryProfile;

        return [
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status->value,
                'estimated_delivery_minutes' => (int) $order->estimated_delivery_minutes,
                'delivery_otp' => $order->status === OrderStatus::OUT_FOR_DELIVERY ? $order->delivery_otp : null,
            ],
            'restaurant' => [
                'id' => $order->restaurant?->id,
                'name' => $order->restaurant?->name,
                'address' => $order->restaurant?->address_line1,
                'latitude' => (float) ($order->restaurant?->latitude ?? 0),
                'longitude' => (float) ($order->restaurant?->longitude ?? 0),
            ],
            'customer_destination' => [
                'contact_name' => $order->delivery_address_json['contact_name'] ?? null,
                'address' => $order->delivery_address_json['address_line1'] ?? null,
                'latitude' => (float) ($order->delivery_address_json['latitude'] ?? 0),
                'longitude' => (float) ($order->delivery_address_json['longitude'] ?? 0),
            ],
            'rider' => $rider ? [
                'id' => $rider->id,
                'name' => $rider->name,
                'mobile' => $rider->mobile,
                'vehicle_type' => $profile?->vehicle_type?->value,
                'vehicle_number' => $profile?->vehicle_number,
                'rating' => (float) ($profile?->rating ?? 5.0),
                'current_latitude' => (float) ($profile?->current_latitude ?? 0),
                'current_longitude' => (float) ($profile?->current_longitude ?? 0),
                'last_updated_at' => $profile?->last_location_updated_at?->toIso8601String(),
            ] : null,
        ];
    }

    public function getAdminLiveFleet(): array
    {
        $riders = User::whereHas('roles', fn ($q) => $q->where('slug', UserRole::DELIVERY_BOY->value))
            ->with(['deliveryProfile', 'riderOrders' => function ($q) {
                $q->whereIn('status', [OrderStatus::PREPARING, OrderStatus::READY_FOR_PICKUP, OrderStatus::OUT_FOR_DELIVERY])
                    ->with('restaurant');
            }])
            ->get();

        return $riders->map(function ($rider) {
            $profile = $rider->deliveryProfile;
            $activeOrder = $rider->riderOrders->first();

            return [
                'rider_id' => $rider->id,
                'name' => $rider->name,
                'mobile' => $rider->mobile,
                'is_online' => (bool) ($profile?->is_online ?? false),
                'is_busy' => (bool) ($profile?->is_busy ?? false),
                'vehicle_type' => $profile?->vehicle_type?->value,
                'vehicle_number' => $profile?->vehicle_number,
                'latitude' => (float) ($profile?->current_latitude ?? 0),
                'longitude' => (float) ($profile?->current_longitude ?? 0),
                'last_location_updated_at' => $profile?->last_location_updated_at?->toIso8601String(),
                'active_order' => $activeOrder ? [
                    'id' => $activeOrder->id,
                    'order_number' => $activeOrder->order_number,
                    'status' => $activeOrder->status->value,
                    'restaurant_name' => $activeOrder->restaurant?->name,
                ] : null,
            ];
        })->toArray();
    }
}
