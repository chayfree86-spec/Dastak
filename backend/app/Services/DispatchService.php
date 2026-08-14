<?php

namespace App\Services;

use App\Enums\ActorType;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class DispatchService
{
    public function autoDispatch(Order $order): ?User
    {
        $restaurant = $order->restaurant;
        if (! $restaurant) {
            return null;
        }

        // Find nearest online & available delivery rider
        $rider = User::whereHas('roles', fn ($q) => $q->where('slug', UserRole::DELIVERY_BOY->value))
            ->whereHas('deliveryProfile', function (Builder $q) {
                $q->where('is_online', true)
                    ->where('is_busy', false);
            })
            ->first();

        if ($rider) {
            $this->assignRiderToOrder($order, $rider, null, ActorType::SYSTEM);
            return $rider;
        }

        return null;
    }

    public function manualAssignRider(Order $order, User $rider, User $admin): Order
    {
        if (! $rider->hasRole(UserRole::DELIVERY_BOY)) {
            throw ValidationException::withMessages([
                'rider_id' => ['The selected user is not a registered delivery partner.'],
            ]);
        }

        return $this->assignRiderToOrder($order, $rider, $admin, ActorType::ADMIN);
    }

    protected function assignRiderToOrder(Order $order, User $rider, ?User $actor, ActorType $actorType): Order
    {
        $order->delivery_boy_id = $rider->id;
        $order->save();

        // Mark rider busy
        $rider->deliveryProfile?->update(['is_busy' => true]);

        // Record history
        OrderStatusHistory::create([
            'order_id' => $order->id,
            'from_status' => $order->status->value,
            'to_status' => $order->status->value,
            'actor_id' => $actor?->id,
            'actor_type' => $actorType,
            'comment' => "Assigned to delivery rider: {$rider->name} ({$rider->mobile})",
            'created_at' => now(),
        ]);

        $assignedOrder = $order->fresh(['deliveryBoy.deliveryProfile', 'restaurant', 'customer']);

        // Fire RiderAssignedEvent (Triggers Rider & Customer notifications)
        event(new \App\Events\RiderAssignedEvent($assignedOrder, $rider));

        return $assignedOrder;
    }
}
