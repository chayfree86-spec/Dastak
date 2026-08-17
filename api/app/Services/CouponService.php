<?php

namespace App\Services;

use App\Enums\DiscountType;
use App\Models\Cart;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class CouponService
{
    public function listPublicCoupons(?int $restaurantId = null): Collection
    {
        $query = Coupon::where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>=', now());
            });

        if ($restaurantId) {
            $query->where(function ($q) use ($restaurantId) {
                $q->whereNull('restaurant_id')->orWhere('restaurant_id', $restaurantId);
            });
        } else {
            $query->whereNull('restaurant_id');
        }

        return $query->latest()->get();
    }

    public function isCouponValidForCart(Coupon $coupon, Cart $cart, User $user): bool
    {
        try {
            $this->validateCoupon($coupon, $user, (float) $cart->subtotal, $cart->restaurant_id);
            return true;
        } catch (ValidationException $e) {
            return false;
        }
    }

    public function validateCoupon(Coupon $coupon, User $user, float $orderAmount, ?int $restaurantId = null): void
    {
        if (! $coupon->isValidNow()) {
            throw ValidationException::withMessages([
                'coupon' => ['This promo code has expired or is no longer active.'],
            ]);
        }

        // Restaurant constraint check
        if ($coupon->restaurant_id !== null && $coupon->restaurant_id !== $restaurantId) {
            throw ValidationException::withMessages([
                'coupon' => ['This promo code is not applicable for this restaurant.'],
            ]);
        }

        // Minimum order value check
        if ($orderAmount < (float) $coupon->min_order_value) {
            throw ValidationException::withMessages([
                'coupon' => ["This promo code requires a minimum order amount of ₹{$coupon->min_order_value}."],
            ]);
        }

        // User usage limit check
        $userUsageCount = CouponUsage::where('coupon_id', $coupon->id)
            ->where('user_id', $user->id)
            ->count();

        if ($userUsageCount >= $coupon->usage_limit_per_user) {
            throw ValidationException::withMessages([
                'coupon' => ['You have already reached the maximum usage limit for this coupon.'],
            ]);
        }
    }

    public function calculateDiscount(Coupon $coupon, float $subtotal): float
    {
        if ($coupon->discount_type === DiscountType::PERCENTAGE) {
            $rawDiscount = ($subtotal * (float) $coupon->discount_value) / 100;
            if ($coupon->max_discount_amount !== null && $coupon->max_discount_amount > 0) {
                $rawDiscount = min($rawDiscount, (float) $coupon->max_discount_amount);
            }
            return round($rawDiscount, 2);
        }

        // Flat amount discount
        return round(min((float) $coupon->discount_value, $subtotal), 2);
    }

    public function recordUsage(Coupon $coupon, User $user, ?int $orderId, float $discountAmount): CouponUsage
    {
        $usage = CouponUsage::create([
            'coupon_id' => $coupon->id,
            'user_id' => $user->id,
            'order_id' => $orderId,
            'discount_amount' => $discountAmount,
            'used_at' => now(),
        ]);

        $coupon->increment('total_used_count');

        return $usage;
    }
}
