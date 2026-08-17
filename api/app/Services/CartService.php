<?php

namespace App\Services;

use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\CartItemAddon;
use App\Models\Coupon;
use App\Models\MenuItem;
use App\Models\MenuItemAddon;
use App\Models\MenuItemVariant;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartService
{
    public function __construct(
        protected PricingService $pricingService,
        protected CouponService $couponService
    ) {}

    public function getOrCreateCart(User $user): Cart
    {
        $cart = Cart::firstOrCreate(
            ['user_id' => $user->id],
            [
                'subtotal' => 0.00,
                'discount_amount' => 0.00,
                'delivery_fee' => 0.00,
                'tax_amount' => 0.00,
                'total_amount' => 0.00,
            ]
        );

        // Auto attach default address if not set
        if (! $cart->delivery_address_id) {
            $defaultAddress = $user->addresses()->where('is_default', true)->first();
            if ($defaultAddress) {
                $cart->update(['delivery_address_id' => $defaultAddress->id]);
            }
        }

        return $this->pricingService->recalculateCart($cart);
    }

    public function addItem(
        User $user,
        int $restaurantId,
        int $menuItemId,
        ?int $variantId = null,
        array $addonIds = [],
        int $quantity = 1,
        ?string $instructions = null,
        bool $forceClear = false
    ): Cart {
        return DB::transaction(function () use (
            $user, $restaurantId, $menuItemId, $variantId, $addonIds, $quantity, $instructions, $forceClear
        ) {
            $cart = Cart::firstOrCreate(['user_id' => $user->id]);

            // Validate Restaurant
            $restaurant = Restaurant::findOrFail($restaurantId);
            if (! $restaurant->is_active || ! $restaurant->is_open) {
                throw ValidationException::withMessages([
                    'restaurant' => ['This restaurant is currently closed or not accepting orders.'],
                ]);
            }

            // Validate Delivery Radius if address is already selected
            if ($cart->delivery_address_id) {
                $address = Address::where('user_id', $user->id)->find($cart->delivery_address_id);
                if ($address && $restaurant->latitude !== null && $restaurant->longitude !== null &&
                    $address->latitude !== null && $address->longitude !== null) {
                    
                    $distance = Restaurant::calculateDistance(
                        (float) $restaurant->latitude,
                        (float) $restaurant->longitude,
                        (float) $address->latitude,
                        (float) $address->longitude
                    );
                    
                    $radiusLimit = (float) ($restaurant->delivery_radius_km ?? 12);
                    
                    if ($distance > $radiusLimit) {
                        throw ValidationException::withMessages([
                            'address' => [sprintf(
                                'This restaurant is outside your delivery range (%.2f km away, max range %d km).',
                                $distance,
                                $radiusLimit
                            )],
                        ]);
                    }
                }
            }

            // Single Restaurant Constraint
            if ($cart->restaurant_id && $cart->restaurant_id !== $restaurantId && $cart->items()->exists()) {
                if (! $forceClear) {
                    throw ValidationException::withMessages([
                        'restaurant_conflict' => [
                            'Your cart contains items from a different restaurant. Would you like to clear your cart and add this item instead?',
                        ],
                    ]);
                }

                // Clear previous cart
                $cart->items()->delete();
                $cart->coupon_id = null;
            }

            $cart->restaurant_id = $restaurantId;
            $cart->save();

            // Validate Item
            $item = MenuItem::where('restaurant_id', $restaurantId)->findOrFail($menuItemId);
            if (! $item->is_available) {
                throw ValidationException::withMessages([
                    'item' => ['This item is currently out of stock.'],
                ]);
            }

            // Determine unit price (Variant price replaces or overrides base price)
            $unitPrice = $item->discount_price ?? $item->base_price;
            if ($variantId) {
                $variant = MenuItemVariant::findOrFail($variantId);
                if (! $variant->is_available) {
                    throw ValidationException::withMessages([
                        'variant' => ['The selected variant is currently out of stock.'],
                    ]);
                }
                $unitPrice = $variant->price;
            }

            // Create Cart Item
            $cartItem = CartItem::create([
                'cart_id' => $cart->id,
                'menu_item_id' => $item->id,
                'variant_id' => $variantId,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total_price' => $unitPrice * $quantity,
                'instructions' => $instructions,
            ]);

            // Attach Addons
            if (! empty($addonIds)) {
                $addons = MenuItemAddon::whereIn('id', $addonIds)->where('is_available', true)->get();
                foreach ($addons as $addon) {
                    CartItemAddon::create([
                        'cart_item_id' => $cartItem->id,
                        'addon_id' => $addon->id,
                        'price' => $addon->price,
                    ]);
                }
            }

            return $this->pricingService->recalculateCart($cart);
        });
    }

    public function updateQuantity(User $user, int $cartItemId, int $quantity): Cart
    {
        $cart = $this->getOrCreateCart($user);
        $cartItem = $cart->items()->findOrFail($cartItemId);

        if ($quantity <= 0) {
            $cartItem->delete();
            if ($cart->items()->count() === 0) {
                $cart->update(['restaurant_id' => null, 'coupon_id' => null]);
            }
        } else {
            $cartItem->update(['quantity' => $quantity]);
        }

        return $this->pricingService->recalculateCart($cart);
    }

    public function removeItem(User $user, int $cartItemId): Cart
    {
        $cart = $this->getOrCreateCart($user);
        $cartItem = $cart->items()->findOrFail($cartItemId);
        $cartItem->delete();

        if ($cart->items()->count() === 0) {
            $cart->update(['restaurant_id' => null, 'coupon_id' => null]);
        }

        return $this->pricingService->recalculateCart($cart);
    }

    public function clearCart(User $user): Cart
    {
        $cart = $this->getOrCreateCart($user);
        $cart->items()->delete();
        $cart->update([
            'restaurant_id' => null,
            'coupon_id' => null,
            'subtotal' => 0.00,
            'discount_amount' => 0.00,
            'delivery_fee' => 0.00,
            'tax_amount' => 0.00,
            'total_amount' => 0.00,
        ]);

        return $cart->fresh();
    }

    public function applyCoupon(User $user, string $couponCode): Cart
    {
        $cart = $this->getOrCreateCart($user);

        if ($cart->items()->count() === 0) {
            throw ValidationException::withMessages([
                'cart' => ['Your cart is empty. Add items to apply coupon.'],
            ]);
        }

        $coupon = Coupon::where('code', strtoupper(trim($couponCode)))->first();
        if (! $coupon) {
            throw ValidationException::withMessages([
                'coupon' => ['Invalid promo code entered.'],
            ]);
        }

        $this->couponService->validateCoupon(
            coupon: $coupon,
            user: $user,
            orderAmount: (float) $cart->subtotal,
            restaurantId: $cart->restaurant_id
        );

        $cart->update(['coupon_id' => $coupon->id]);

        return $this->pricingService->recalculateCart($cart);
    }

    public function removeCoupon(User $user): Cart
    {
        $cart = $this->getOrCreateCart($user);
        $cart->update(['coupon_id' => null]);

        return $this->pricingService->recalculateCart($cart);
    }

    public function setDeliveryAddress(User $user, int $addressId): Cart
    {
        $cart = $this->getOrCreateCart($user);
        $address = $user->addresses()->findOrFail($addressId);

        // Validate Delivery Radius if cart has a restaurant
        if ($cart->restaurant_id) {
            $restaurant = Restaurant::find($cart->restaurant_id);
            if ($restaurant && $restaurant->latitude !== null && $restaurant->longitude !== null &&
                $address->latitude !== null && $address->longitude !== null) {
                
                $distance = Restaurant::calculateDistance(
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
        }

        $cart->update(['delivery_address_id' => $address->id]);

        return $this->pricingService->recalculateCart($cart);
    }
}
