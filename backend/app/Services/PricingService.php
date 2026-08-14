<?php

namespace App\Services;

use App\Models\Address;
use App\Models\Cart;
use App\Models\Restaurant;

class PricingService
{
    public function calculateDeliveryFee(?Restaurant $restaurant = null, ?Address $address = null): float
    {
        $baseFee = (float) config('dastak.delivery.base_fee', 35.00);

        if (! $restaurant || ! $address || $address->latitude === null || $address->longitude === null) {
            return $baseFee;
        }

        // Distance in KM using Haversine
        $distanceKm = $this->calculateHaversineDistance(
            (float) $restaurant->latitude,
            (float) $restaurant->longitude,
            (float) $address->latitude,
            (float) $address->longitude
        );

        if ($distanceKm <= 3.0) {
            return $baseFee;
        }

        // Additional ₹10 per KM beyond 3 KM
        $extraKm = ceil($distanceKm - 3.0);
        return round($baseFee + ($extraKm * 10.00), 2);
    }

    public function calculateTax(float $taxableAmount, float $taxPercentage = 5.00): float
    {
        return round(($taxableAmount * $taxPercentage) / 100, 2);
    }

    public function recalculateCart(Cart $cart): Cart
    {
        $cart->load(['items.addons', 'restaurant', 'coupon', 'deliveryAddress']);

        // 1. Calculate Subtotal
        $subtotal = 0.00;
        foreach ($cart->items as $item) {
            $itemAddonSum = $item->addons->sum('price');
            $itemUnitPrice = (float) $item->unit_price + (float) $itemAddonSum;
            $itemTotal = round($itemUnitPrice * $item->quantity, 2);

            $item->update(['total_price' => $itemTotal]);
            $subtotal += $itemTotal;
        }

        $cart->subtotal = round($subtotal, 2);

        // 2. Calculate Discount from Applied Coupon
        $discount = 0.00;
        if ($cart->coupon) {
            $couponService = app(CouponService::class);
            if ($couponService->isCouponValidForCart($cart->coupon, $cart, $cart->user)) {
                $discount = $couponService->calculateDiscount($cart->coupon, $cart->subtotal);
            } else {
                // Invalidate/remove coupon if cart no longer satisfies rules
                $cart->coupon_id = null;
            }
        }
        $cart->discount_amount = round($discount, 2);

        // 3. Calculate Delivery Fee
        $deliveryFee = $this->calculateDeliveryFee($cart->restaurant, $cart->deliveryAddress);
        $cart->delivery_fee = $cart->items->count() > 0 ? $deliveryFee : 0.00;

        // 4. Calculate Tax
        $taxableAmount = max(0, $cart->subtotal - $cart->discount_amount);
        $cart->tax_amount = $cart->items->count() > 0 ? $this->calculateTax($taxableAmount, 5.00) : 0.00;

        // 5. Grand Total
        $total = $taxableAmount + $cart->delivery_fee + $cart->tax_amount;
        $cart->total_amount = $cart->items->count() > 0 ? round($total, 2) : 0.00;

        $cart->save();

        return $cart->fresh(['items.menuItem', 'items.variant', 'items.addons.addon', 'coupon', 'deliveryAddress', 'restaurant']);
    }

    protected function calculateHaversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadiusKm = 6371;

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadiusKm * $c;
    }
}
