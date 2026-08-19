<?php

namespace App\Services;

use App\Enums\ActorType;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\User;
use App\Models\DeliveryBoyProfile;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DispatchService
{
    public function autoDispatch(Order $order): ?User
    {
        $restaurant = $order->restaurant;
        if (! $restaurant) {
            return null;
        }

        return DB::transaction(function () use ($order) {
            // Find nearest online & available delivery rider with update lock
            $rider = User::whereHas('roles', fn ($q) => $q->where('slug', UserRole::DELIVERY_BOY->value))
                ->whereHas('deliveryProfile', function (Builder $q) {
                    $q->where('is_online', true)
                        ->where('is_busy', false);
                })
                ->lockForUpdate()
                ->first();

            if ($rider) {
                $this->assignRiderToOrder($order, $rider, null, ActorType::SYSTEM);
                return $rider;
            }

            return null;
        });
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
        return DB::transaction(function () use ($order, $rider, $actor, $actorType) {
            // Atomic lock on order and rider profile
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();
            $lockedProfile = DeliveryBoyProfile::where('user_id', $rider->id)->lockForUpdate()->first();

            $lockedOrder->delivery_boy_id = $rider->id;
            $lockedOrder->save();

            // Mark rider busy
            if ($lockedProfile) {
                $lockedProfile->is_busy = true;
                $lockedProfile->save();
            }

            // Record history
            OrderStatusHistory::create([
                'order_id' => $lockedOrder->id,
                'from_status' => $lockedOrder->status->value,
                'to_status' => $lockedOrder->status->value,
                'actor_id' => $actor?->id,
                'actor_type' => $actorType,
                'comment' => "Assigned to delivery rider: {$rider->name} ({$rider->mobile})",
                'created_at' => now(),
            ]);

            $assignedOrder = $lockedOrder->fresh(['deliveryBoy.deliveryProfile', 'restaurant', 'customer']);

            // Fire RiderAssignedEvent (Triggers Rider & Customer notifications)
            try {
                event(new \App\Events\RiderAssignedEvent($assignedOrder, $rider));
            } catch (\Exception $e) {
                // Continue
            }

            return $assignedOrder;
        });
    }
}
