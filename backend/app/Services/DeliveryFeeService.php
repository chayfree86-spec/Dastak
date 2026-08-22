<?php

namespace App\Services;

use App\Models\SystemSetting;

/**
 * Fully-configurable delivery fee engine driven by admin settings
 * (Settings ▸ Delivery & Fleet). Combines:
 *   - free delivery above an order amount
 *   - a base fee covering a base distance
 *   - a per-km charge beyond the base distance
 *   - an optional maximum fee cap
 */
class DeliveryFeeService
{
    public function config(): array
    {
        $tiers = SystemSetting::get('delivery_tiers', []);

        return [
            'all_free_delivery' => (bool) SystemSetting::get('all_free_delivery', false),
            'free_delivery_radius_km' => (float) SystemSetting::get('free_delivery_radius_km', 0),
            // Distance bands, each with its own free-above amount + fee.
            'delivery_tiers' => is_array($tiers) ? array_values($tiers) : [],
            'free_delivery_min_order' => (float) SystemSetting::get('free_delivery_min_order', 0),
            'base_delivery_fee' => (float) SystemSetting::get('base_delivery_fee', 35),
            'base_delivery_distance_km' => (float) SystemSetting::get('base_delivery_distance_km', 3),
            'per_km_charge' => (float) SystemSetting::get('per_km_charge', 0),
            'max_delivery_fee' => (float) SystemSetting::get('max_delivery_fee', 0),
        ];
    }

    /**
     * Compute the delivery fee for an order.
     *
     * @param  float       $orderAmount  item subtotal (used for the free threshold)
     * @param  float|null  $distanceKm   restaurant → customer distance (null = unknown, no per-km)
     */
    public function compute(float $orderAmount, ?float $distanceKm = null): array
    {
        $c = $this->config();

        // Festival / promo — free delivery for everyone, any order value.
        if ($c['all_free_delivery']) {
            return $this->freeResult($distanceKm, 'festival_all_free');
        }

        // Distance tiers take full precedence when configured — they define
        // both the free rule and the fee per km band, so the simple free-radius
        // / free-above / standard rules are NOT applied (avoids conflicts).
        if (! empty($c['delivery_tiers'])) {
            return $this->computeFromTiers($c['delivery_tiers'], $orderAmount, $distanceKm, $c['max_delivery_fee']);
        }

        // Free delivery within a nearby radius (any order value).
        if ($c['free_delivery_radius_km'] > 0 && $distanceKm !== null
            && $distanceKm <= $c['free_delivery_radius_km']) {
            return $this->freeResult($distanceKm, 'within_free_radius');
        }

        // Free delivery above the configured order amount.
        if ($c['free_delivery_min_order'] > 0 && $orderAmount >= $c['free_delivery_min_order']) {
            return $this->freeResult($distanceKm, 'free_above_min_order');
        }

        $fee = $c['base_delivery_fee'];

        // Per-km surcharge beyond the base distance.
        if ($c['per_km_charge'] > 0 && $distanceKm !== null && $distanceKm > $c['base_delivery_distance_km']) {
            $extraKm = (int) ceil($distanceKm - $c['base_delivery_distance_km']);
            $fee += $extraKm * $c['per_km_charge'];
        }

        // Optional cap.
        if ($c['max_delivery_fee'] > 0) {
            $fee = min($fee, $c['max_delivery_fee']);
        }

        return [
            'fee' => round($fee, 2),
            'is_free' => false,
            'distance_km' => $distanceKm !== null ? round($distanceKm, 2) : null,
            'reason' => 'base_plus_distance',
        ];
    }

    /**
     * Resolve fee from distance tiers. Each tier: {up_to_km, free_above, fee}.
     * The first tier whose up_to_km >= distance wins; beyond all tiers uses the
     * largest tier. Unknown distance falls back to the nearest (first) tier.
     */
    protected function computeFromTiers(array $tiers, float $orderAmount, ?float $distanceKm, float $maxFee): array
    {
        $tiers = array_values(array_filter($tiers, fn ($t) => is_array($t) && isset($t['up_to_km'])));
        usort($tiers, fn ($a, $b) => (float) $a['up_to_km'] <=> (float) $b['up_to_km']);

        if (empty($tiers)) {
            return $this->freeResult($distanceKm, 'no_tiers');
        }

        $dist = $distanceKm ?? 0.0;
        $matched = null;
        foreach ($tiers as $t) {
            if ($dist <= (float) $t['up_to_km']) {
                $matched = $t;
                break;
            }
        }
        // Beyond the largest configured band → use that largest band.
        $matched ??= $tiers[count($tiers) - 1];

        $freeAbove = (float) ($matched['free_above'] ?? 0);
        if ($freeAbove > 0 && $orderAmount >= $freeAbove) {
            return $this->freeResult($distanceKm, 'tier_free_above');
        }

        $fee = (float) ($matched['fee'] ?? 0);
        if ($maxFee > 0) {
            $fee = min($fee, $maxFee);
        }

        return [
            'fee' => round($fee, 2),
            'is_free' => false,
            'distance_km' => $distanceKm !== null ? round($distanceKm, 2) : null,
            'reason' => 'tier_fee',
        ];
    }

    protected function freeResult(?float $distanceKm, string $reason): array
    {
        return [
            'fee' => 0.0,
            'is_free' => true,
            'distance_km' => $distanceKm !== null ? round($distanceKm, 2) : null,
            'reason' => $reason,
        ];
    }

    /** Great-circle distance in km between two lat/lng points. */
    public function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        if (! $lat1 || ! $lng1 || ! $lat2 || ! $lng2) {
            return 0.0;
        }
        $r = 6371; // km
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return round($r * 2 * atan2(sqrt($a), sqrt(1 - $a)), 2);
    }
}
