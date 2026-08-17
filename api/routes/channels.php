<?php

use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// 1. Customer / Rider / Restaurant Order Live Tracking Channel
Broadcast::channel('order.{orderNumber}', function (User $user, string $orderNumber) {
    $order = Order::where('order_number', $orderNumber)->first();
    if (! $order) {
        return false;
    }

    // Customer can listen to their own order
    if ($order->customer_id === $user->id) {
        return true;
    }

    // Assigned Rider can listen to the order
    if ($order->delivery_boy_id === $user->id) {
        return true;
    }

    // Restaurant owner can listen
    if ($order->restaurant && $order->restaurant->owner_id === $user->id) {
        return true;
    }

    // Super Admin / Operations Admin can listen
    return $user->hasRole([UserRole::SUPER_ADMIN, UserRole::OPERATIONS_ADMIN]);
});

// 2. Restaurant Kitchen Channel
Broadcast::channel('restaurant.{restaurantId}', function (User $user, int $restaurantId) {
    $restaurant = Restaurant::find($restaurantId);
    if (! $restaurant) {
        return false;
    }

    return $restaurant->owner_id === $user->id || $user->hasRole(UserRole::SUPER_ADMIN);
});

// 3. Delivery Rider Task Channel
Broadcast::channel('rider.{riderId}', function (User $user, int $riderId) {
    return $user->id === (int) $riderId || $user->hasRole(UserRole::SUPER_ADMIN);
});

// 4. Rider Telemetry Channel
Broadcast::channel('rider-telemetry.{riderId}', function (User $user, int $riderId) {
    return $user->id === (int) $riderId || $user->hasRole([UserRole::SUPER_ADMIN, UserRole::OPERATIONS_ADMIN]);
});

// 5. Admin Operations & Fleet Channels
Broadcast::channel('admin-orders', function (User $user) {
    return $user->hasRole([UserRole::SUPER_ADMIN, UserRole::OPERATIONS_ADMIN]);
});

Broadcast::channel('admin-fleet', function (User $user) {
    return $user->hasRole([UserRole::SUPER_ADMIN, UserRole::OPERATIONS_ADMIN]);
});
