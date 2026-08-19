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
            $hasDbCartItems = $cart->items()->count() > 0;
            $hasPayloadItems = !empty($checkoutData['items']) && is_array($checkoutData['items']) && count($checkoutData['items']) > 0;

            if (!$hasDbCartItems && !$hasPayloadItems) {
                throw ValidationException::withMessages([
                    'cart' => ['Cannot checkout an empty cart.'],
                ]);
            }

            // Restaurant lookup
            $restaurant = null;
            if ($hasDbCartItems) {
                $restaurant = $cart->restaurant;
            }
            if (!$restaurant && !empty($checkoutData['restaurant_id'])) {
                $restaurant = \App\Models\Restaurant::find($checkoutData['restaurant_id']);
            }
            if (!$restaurant) {
                $restaurant = \App\Models\Restaurant::where('is_active', true)->first() 
                    ?? \App\Models\Restaurant::first();
            }

            // Delivery Address lookup / create
            $addressId = $checkoutData['delivery_address_id'] ?? $cart->delivery_address_id;
            if (!$addressId && !empty($checkoutData['delivery_address_json'])) {
                $addrJson = $checkoutData['delivery_address_json'];
                $address = Address::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'address_line1' => $addrJson['address'] ?? 'Customer Location',
                    ],
                    [
                        'type' => \App\Enums\AddressType::HOME,
                        'contact_name' => $addrJson['customer_name'] ?? $user->name,
                        'contact_mobile' => $addrJson['customer_phone'] ?? $user->mobile,
                        'landmark' => $addrJson['landmark'] ?? null,
                        'city' => 'Lalganj',
                        'pincode' => '276202',
                        'latitude' => $addrJson['latitude'] ?? 26.456,
                        'longitude' => $addrJson['longitude'] ?? 80.339,
                        'is_default' => true,
                    ]
                );
            } elseif ($addressId) {
                $address = Address::where('user_id', $user->id)->find($addressId)
                    ?? $user->addresses()->first()
                    ?? Address::firstOrCreate(
                        ['user_id' => $user->id],
                        [
                            'type' => \App\Enums\AddressType::HOME,
                            'contact_name' => $user->name,
                            'contact_mobile' => $user->mobile,
                            'address_line1' => 'Lalganj, Azamgarh',
                            'city' => 'Lalganj',
                            'pincode' => '276202',
                            'is_default' => true,
                        ]
                    );
            } else {
                $address = $user->addresses()->first()
                    ?? Address::create([
                        'user_id' => $user->id,
                        'type' => \App\Enums\AddressType::HOME,
                        'contact_name' => $user->name,
                        'contact_mobile' => $user->mobile,
                        'address_line1' => 'Lalganj, Azamgarh',
                        'city' => 'Lalganj',
                        'pincode' => '276202',
                        'is_default' => true,
                    ]);
            }

            // Calculate Order Financials
            $subtotal = 0.0;
            $itemsToCreate = [];

            if ($hasDbCartItems) {
                $subtotal = (float) $cart->subtotal;
                $discountAmount = (float) $cart->discount_amount;
                $deliveryFee = (float) $cart->delivery_fee;
                $taxAmount = (float) $cart->tax_amount;
                $totalAmount = (float) $cart->total_amount;

                foreach ($cart->items as $cartItem) {
                    $itemsToCreate[] = [
                        'menu_item_id' => $cartItem->menu_item_id,
                        'item_name' => $cartItem->menuItem?->name ?? 'Dish',
                        'variant_id' => $cartItem->variant_id,
                        'variant_name' => $cartItem->variant?->name,
                        'quantity' => $cartItem->quantity,
                        'unit_price' => $cartItem->unit_price,
                        'total_price' => $cartItem->total_price,
                        'instructions' => $cartItem->instructions,
                        'addons' => $cartItem->addons,
                    ];
                }
            } else {
                // Direct from payload
                foreach ($checkoutData['items'] as $it) {
                    $menuItemId = (int) ($it['menu_item_id'] ?? $it['id'] ?? 1);
                    $menuItem = \App\Models\MenuItem::find($menuItemId);
                    $qty = max(1, (int) ($it['quantity'] ?? 1));
                    $unitPrice = (float) ($it['price'] ?? $menuItem?->discount_price ?? $menuItem?->base_price ?? 49.00);
                    $lineTotal = round($unitPrice * $qty, 2);
                    $subtotal += $lineTotal;

                    $itemsToCreate[] = [
                        'menu_item_id' => $menuItem?->id ?? $menuItemId,
                        'item_name' => $it['name'] ?? $menuItem?->name ?? 'Special Dish',
                        'variant_id' => null,
                        'variant_name' => null,
                        'quantity' => $qty,
                        'unit_price' => $unitPrice,
                        'total_price' => $lineTotal,
                        'instructions' => $it['instructions'] ?? null,
                        'addons' => [],
                    ];
                }

                $discountAmount = 0.0;
                $deliveryFee = 25.00;
                $taxAmount = round(($subtotal * 5) / 100, 2);
                $totalAmount = round($subtotal - $discountAmount + $deliveryFee + $taxAmount, 2);
            }

            // Unique Order Number & OTP
            $orderNumber = 'DSTK-' . date('Ymd') . '-' . strtoupper(Str::random(5));
            $deliveryOtp = (string) random_int(1000, 9999);

            $commissionRate = (float) ($restaurant?->commission_rate ?? 15.00);
            $taxableItemTotal = max(0, $subtotal - $discountAmount);
            $commissionAmount = round(($taxableItemTotal * $commissionRate) / 100, 2);
            $restaurantPayout = round($taxableItemTotal - $commissionAmount + $taxAmount, 2);

            $paymentMode = PaymentMode::from($checkoutData['payment_mode'] ?? PaymentMode::COD->value);
            $paymentStatus = $paymentMode === PaymentMode::ONLINE ? PaymentStatus::PAID : PaymentStatus::PENDING;

            // 1. Create Order
            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => $user->id,
                'restaurant_id' => $restaurant?->id ?? 1,
                'status' => OrderStatus::PENDING,
                'payment_status' => $paymentStatus,
                'payment_mode' => $paymentMode,
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'delivery_fee' => $deliveryFee,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
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
                'estimated_delivery_minutes' => (int) (($restaurant?->preparation_time_minutes ?? 25) + 15),
                'placed_at' => now(),
            ]);

            // 2. Create Order Items
            foreach ($itemsToCreate as $itData) {
                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $itData['menu_item_id'],
                    'item_name' => $itData['item_name'],
                    'variant_id' => $itData['variant_id'],
                    'variant_name' => $itData['variant_name'],
                    'quantity' => $itData['quantity'],
                    'unit_price' => $itData['unit_price'],
                    'total_price' => $itData['total_price'],
                    'instructions' => $itData['instructions'],
                ]);

                if (!empty($itData['addons'])) {
                    foreach ($itData['addons'] as $addon) {
                        OrderItemAddon::create([
                            'order_item_id' => $orderItem->id,
                            'addon_id' => $addon->addon_id ?? $addon['addon_id'],
                            'addon_name' => $addon->addon?->name ?? $addon['addon_name'] ?? 'Addon',
                            'price' => $addon->price ?? $addon['price'] ?? 0,
                        ]);
                    }
                }
            }

            // 3. Record Initial State History
            OrderStatusHistory::create([
                'order_id' => $order->id,
                'from_status' => null,
                'to_status' => OrderStatus::PENDING->value,
                'actor_id' => $user->id,
                'actor_type' => ActorType::CUSTOMER,
                'comment' => 'Order placed successfully by customer.',
                'created_at' => now(),
            ]);

            // 4. Empty Cart
            if ($hasDbCartItems) {
                $this->cartService->clearCart($user);
            }

            // Trigger Auto-Dispatch
            try {
                $this->dispatchService->autoDispatch($order);
            } catch (\Exception $e) {
                // Continue
            }

            $freshOrder = $order->fresh(['items.addons', 'restaurant.owner', 'statusHistories', 'customer']);

            // Fire OrderPlacedEvent (Triggers Customer & Restaurant notifications)
            try {
                event(new \App\Events\OrderPlacedEvent($freshOrder));
            } catch (\Exception $e) {
                // Continue
            }

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

    public function confirmOrder(Order $order, ?User $actor, int $prepTimeMinutes = 15): Order
    {
        $order->estimated_delivery_minutes = $prepTimeMinutes;
        $order->save();

        return $this->transitionStatus(
            order: $order,
            targetStatus: OrderStatus::CONFIRMED,
            actor: $actor,
            actorType: ActorType::RESTAURANT,
            comment: "Order accepted by restaurant. Estimated cooking time: {$prepTimeMinutes} mins."
        );
    }

    public function updateStatus(Order $order, OrderStatus $newStatus, ?User $actor, ?string $notes = null): Order
    {
        return $this->transitionStatus(
            order: $order,
            targetStatus: $newStatus,
            actor: $actor,
            actorType: ActorType::RESTAURANT,
            comment: $notes
        );
    }

    public function markReadyForPickup(Order $order, ?User $actor): Order
    {
        return $this->transitionStatus(
            order: $order,
            targetStatus: OrderStatus::READY_FOR_PICKUP,
            actor: $actor,
            actorType: ActorType::RESTAURANT,
            comment: 'Food is packed and ready for delivery rider pickup.'
        );
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

    public function verifyDelivery(Order $order, ?string $otp, User $rider): Order
    {
        if ($order->status !== OrderStatus::OUT_FOR_DELIVERY) {
            throw ValidationException::withMessages([
                'order' => ['Order must be out for delivery to verify completion.'],
            ]);
        }

        // Enforce OTP verification whenever delivery_otp is configured
        if ($order->delivery_otp !== null) {
            if (empty($otp) || trim((string) $order->delivery_otp) !== trim((string) $otp)) {
                throw ValidationException::withMessages([
                    'delivery_otp' => ['Invalid 4-digit verification OTP provided.'],
                ]);
            }
        }

        $comment = $order->payment_mode === PaymentMode::COD
            ? 'COD cash collection verified and order marked delivered.'
            : 'Online order verified with 4-digit customer OTP and marked delivered.';

        return $this->transitionStatus(
            order: $order,
            targetStatus: OrderStatus::DELIVERED,
            actor: $rider,
            actorType: ActorType::DELIVERY_BOY,
            comment: $comment
        );
    }

    public function listOrders(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Order::with(['restaurant', 'customer', 'deliveryBoy', 'items']);

        if (! empty($filters['status'])) {
            if (is_array($filters['status'])) {
                $query->whereIn('status', $filters['status']);
            } elseif (str_contains($filters['status'], ',')) {
                $query->whereIn('status', explode(',', $filters['status']));
            } else {
                $query->where('status', $filters['status']);
            }
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
