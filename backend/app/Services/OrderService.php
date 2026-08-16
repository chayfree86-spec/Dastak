<?php

namespace App\Services;

use App\Enums\ActorType;
use App\Enums\OrderStatus;
use App\Enums\PaymentMode;
use App\Enums\PaymentStatus;
use App\Models\Address;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemAddon;
use App\Models\OrderStatusHistory;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        protected CartService $cartService,
        protected CouponService $couponService,
        protected DispatchService $dispatchService
    ) {}

    public function checkout(User $user, array $checkoutData): Order
    {
        return DB::transaction(function () use ($user, $checkoutData) {
            $cart = $this->cartService->getOrCreateCart($user);

            if ($cart->items()->count() === 0) {
                throw ValidationException::withMessages([
                    'cart' => ['Cannot checkout an empty cart.'],
                ]);
            }

            $restaurant = $cart->restaurant;
            if (! $restaurant || ! $restaurant->is_active || ! $restaurant->is_open) {
                throw ValidationException::withMessages([
                    'restaurant' => ['Restaurant is not currently accepting orders.'],
                ]);
            }

            // Delivery Address
            $addressId = $checkoutData['delivery_address_id'] ?? $cart->delivery_address_id;
            if (! $addressId) {
                throw ValidationException::withMessages([
                    'address' => ['Please provide a delivery address.'],
                ]);
            }

            $address = Address::where('user_id', $user->id)->findOrFail($addressId);

            // Validate Delivery Radius
            if ($restaurant->latitude !== null && $restaurant->longitude !== null &&
                $address->latitude !== null && $address->longitude !== null) {
                
                $distance = \App\Models\Restaurant::calculateDistance(
                    (float) $restaurant->latitude,
                    (float) $restaurant->longitude,
                    (float) $address->latitude,
                    (float) $address->longitude
                );
                
                $radiusLimit = (float) ($restaurant->delivery_radius_km ?? 12);
                
                if ($distance > $radiusLimit) {
                    throw ValidationException::withMessages([
                        'address' => [sprintf(
                            'Your delivery location is %.2f km away, which is outside this restaurant\'s delivery range (max %d km).',
                            $distance,
                            $radiusLimit
                        )],
                    ]);
                }
            }

            // Generate Unique Order Number e.g. DSTK-2026-XXXX
            $orderNumber = 'DSTK-' . date('Ymd') . '-' . strtoupper(Str::random(5));

            // Generate 4-digit Delivery Verification OTP
            $deliveryOtp = (string) random_int(1000, 9999);

            // Commission & Payout Calculations
            $commissionRate = (float) ($restaurant->commission_rate ?? 15.00);
            $taxableItemTotal = max(0, (float) $cart->subtotal - (float) $cart->discount_amount);
            $commissionAmount = round(($taxableItemTotal * $commissionRate) / 100, 2);
            $restaurantPayout = round($taxableItemTotal - $commissionAmount + (float) $cart->tax_amount, 2);

            $paymentMode = PaymentMode::from($checkoutData['payment_mode'] ?? PaymentMode::COD->value);
            $paymentStatus = $paymentMode === PaymentMode::ONLINE ? PaymentStatus::PAID : PaymentStatus::PENDING;

            // 1. Create Order
            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => $user->id,
                'restaurant_id' => $restaurant->id,
                'status' => OrderStatus::PENDING,
                'payment_status' => $paymentStatus,
                'payment_mode' => $paymentMode,
                'subtotal' => $cart->subtotal,
                'discount_amount' => $cart->discount_amount,
                'delivery_fee' => $cart->delivery_fee,
                'tax_amount' => $cart->tax_amount,
                'total_amount' => $cart->total_amount,
                'commission_rate' => $commissionRate,
                'commission_amount' => $commissionAmount,
                'restaurant_payout_amount' => $restaurantPayout,
                'delivery_address_json' => [
                    'id' => $address->id,
                    'contact_name' => $address->contact_name,
                    'contact_mobile' => $address->contact_mobile,
                    'address_line1' => $address->address_line1,
                    'address_line2' => $address->address_line2,
                    'landmark' => $address->landmark,
                    'city' => $address->city,
                    'pincode' => $address->pincode,
                    'latitude' => $address->latitude,
                    'longitude' => $address->longitude,
                ],
                'special_instructions' => $checkoutData['special_instructions'] ?? null,
                'delivery_otp' => $deliveryOtp,
                'estimated_delivery_minutes' => (int) ($restaurant->preparation_time_minutes + 15),
                'placed_at' => now(),
            ]);

            // 2. Clone Cart Items to Order Items
            foreach ($cart->items as $cartItem) {
                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $cartItem->menu_item_id,
                    'item_name' => $cartItem->menuItem->name,
                    'variant_id' => $cartItem->variant_id,
                    'variant_name' => $cartItem->variant?->name,
                    'quantity' => $cartItem->quantity,
                    'unit_price' => $cartItem->unit_price,
                    'total_price' => $cartItem->total_price,
                    'instructions' => $cartItem->instructions,
                ]);

                foreach ($cartItem->addons as $addon) {
                    OrderItemAddon::create([
                        'order_item_id' => $orderItem->id,
                        'addon_id' => $addon->addon_id,
                        'addon_name' => $addon->addon->name,
                        'price' => $addon->price,
                    ]);
                }
            }

            // 3. Record Coupon Usage if coupon was applied
            if ($cart->coupon && $cart->discount_amount > 0) {
                $this->couponService->recordUsage(
                    coupon: $cart->coupon,
                    user: $user,
                    orderId: $order->id,
                    discountAmount: (float) $cart->discount_amount
                );
            }

            // 4. Record Initial State History
            OrderStatusHistory::create([
                'order_id' => $order->id,
                'from_status' => null,
                'to_status' => OrderStatus::PENDING->value,
                'actor_id' => $user->id,
                'actor_type' => ActorType::CUSTOMER,
                'comment' => 'Order placed successfully by customer.',
                'created_at' => now(),
            ]);

            // 5. Empty Cart
            $this->cartService->clearCart($user);

            // Trigger Auto-Dispatch if enabled
            $this->dispatchService->autoDispatch($order);

            $freshOrder = $order->fresh(['items.addons', 'restaurant.owner', 'statusHistories', 'customer']);

            // Fire OrderPlacedEvent (Triggers Customer & Restaurant notifications)
            event(new \App\Events\OrderPlacedEvent($freshOrder));

            return $freshOrder;
        });
    }

    public function transitionStatus(
        Order $order,
        OrderStatus $targetStatus,
        ?User $actor,
        ActorType $actorType,
        ?string $comment = null
    ): Order {
        if ($order->status === $targetStatus) {
            return $order;
        }

        $oldStatus = $order->status;
        $order->status = $targetStatus;

        // Update lifecycle timestamp milestones
        match ($targetStatus) {
            OrderStatus::CONFIRMED => $order->confirmed_at = now(),
            OrderStatus::PREPARING => $order->preparing_at = now(),
            OrderStatus::READY_FOR_PICKUP => $order->ready_at = now(),
            OrderStatus::OUT_FOR_DELIVERY => $order->dispatched_at = now(),
            OrderStatus::DELIVERED => $order->delivered_at = now(),
            OrderStatus::CANCELLED, OrderStatus::REJECTED => $order->cancelled_at = now(),
            default => null,
        };

        if ($targetStatus === OrderStatus::DELIVERED) {
            $order->payment_status = PaymentStatus::PAID;
            
            // Release rider
            if ($order->delivery_boy_id && $order->deliveryBoy?->deliveryProfile) {
                $profile = $order->deliveryBoy->deliveryProfile;
                $profile->increment('total_deliveries');
                $profile->is_busy = false;

                if ($order->payment_mode === PaymentMode::COD) {
                    $profile->pending_cod_amount += $order->total_amount;
                    app(PaymentService::class)->recordCodCollection($order);
                }
                $profile->save();
            }
        }

        if (in_array($targetStatus, [OrderStatus::CANCELLED, OrderStatus::REJECTED, OrderStatus::FAILED])) {
            // Release rider if assigned
            if ($order->delivery_boy_id && $order->deliveryBoy?->deliveryProfile) {
                $order->deliveryBoy->deliveryProfile->update(['is_busy' => false]);
            }
        }

        $order->save();

        OrderStatusHistory::create([
            'order_id' => $order->id,
            'from_status' => $oldStatus->value,
            'to_status' => $targetStatus->value,
            'actor_id' => $actor?->id,
            'actor_type' => $actorType,
            'comment' => $comment ?? "Order status changed from {$oldStatus->label()} to {$targetStatus->label()}.",
            'created_at' => now(),
        ]);

        $updatedOrder = $order->fresh(['items.addons', 'restaurant.owner', 'deliveryBoy', 'statusHistories', 'customer']);

        // Fire OrderStatusUpdatedEvent (Triggers Customer & Rider notifications)
        event(new \App\Events\OrderStatusUpdatedEvent($updatedOrder, $oldStatus, $targetStatus));

        return $updatedOrder;
    }

    public function cancelOrder(Order $order, User $actor, string $reason, string $cancelledBy): Order
    {
        if ($order->status->isFinal()) {
            throw ValidationException::withMessages([
                'order' => ['This order is already completed or cancelled.'],
            ]);
        }

        $order->cancellation_reason = $reason;
        $order->cancelled_by = $cancelledBy;
        $order->cancelled_at = now();

        $actorType = match ($cancelledBy) {
            'CUSTOMER' => ActorType::CUSTOMER,
            'RESTAURANT' => ActorType::RESTAURANT,
            'ADMIN' => ActorType::ADMIN,
            default => ActorType::SYSTEM,
        };

        return $this->transitionStatus(
            order: $order,
            targetStatus: OrderStatus::CANCELLED,
            actor: $actor,
            actorType: $actorType,
            comment: "Order cancelled by {$cancelledBy}. Reason: {$reason}"
        );
    }

    public function verifyDelivery(Order $order, string $otp, User $rider): Order
    {
        if ($order->status !== OrderStatus::OUT_FOR_DELIVERY) {
            throw ValidationException::withMessages([
                'order' => ['Order must be out for delivery to verify completion.'],
            ]);
        }

        if (trim($order->delivery_otp) !== trim($otp)) {
            throw ValidationException::withMessages([
                'delivery_otp' => ['Invalid 4-digit verification code provided.'],
            ]);
        }

        return $this->transitionStatus(
            order: $order,
            targetStatus: OrderStatus::DELIVERED,
            actor: $rider,
            actorType: ActorType::DELIVERY_BOY,
            comment: 'Order successfully delivered with OTP verification.'
        );
    }

    public function listOrders(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Order::with(['restaurant', 'customer', 'deliveryBoy', 'items']);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['restaurant_id'])) {
            $query->where('restaurant_id', $filters['restaurant_id']);
        }

        if (! empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (! empty($filters['delivery_boy_id'])) {
            $query->where('delivery_boy_id', $filters['delivery_boy_id']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($cq) => $cq->where('name', 'like', "%{$search}%")->orWhere('mobile', 'like', "%{$search}%"));
            });
        }

        return $query->latest('placed_at')->paginate($perPage);
    }
}
