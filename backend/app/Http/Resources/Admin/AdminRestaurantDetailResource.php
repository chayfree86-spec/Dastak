<?php

namespace App\Http\Resources\Admin;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full shape for src/pages/restaurants/RestaurantDetails.jsx (overview + earnings tabs).
 */
class AdminRestaurantDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $delivered = $this->orders()->where('status', 'DELIVERED');
        $lifetimeSales = (float) $delivered->sum('total_amount');
        $pendingSettlement = (float) $this->orders()
            ->where('status', 'DELIVERED')
            ->sum('restaurant_payout_amount');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'owner_name' => $this->owner?->name,
            'mobile' => $this->phone,
            'email' => $this->email,
            'address' => trim(($this->address_line1 ?? '').' '.($this->address_line2 ?? '')),
            'city' => $this->city,
            'rating' => (float) $this->rating,
            'total_reviews' => (int) $this->total_ratings,
            'status' => $this->is_active ? 'ACTIVE' : 'SUSPENDED',
            'is_online' => (bool) $this->is_open,
            'commission' => (float) $this->commission_rate,
            'settlement_cycle' => $this->settlement_cycle ?? 'WEEKLY',
            'min_order' => (float) $this->min_order_value,
            'delivery_radius_km' => (int) ($this->delivery_radius_km ?? config('dastak.delivery.max_radius_km', 12)),
            'timing' => $this->buildTiming(),
            'weekly_off' => $this->buildWeeklyOff(),
            'is_veg_only' => (bool) $this->is_pure_veg,
            'total_orders' => (int) $this->orders()->count(),
            'lifetime_sales' => $lifetimeSales,
            'pending_settlement' => $pendingSettlement,
        ];
    }

    protected function buildTiming(): string
    {
        $hours = $this->relationLoaded('operatingHours') ? $this->operatingHours : $this->operatingHours()->get();
        $open = $hours->firstWhere('is_closed', false);

        if (! $open) {
            return 'Hours not set';
        }

        return $this->fmt($open->opening_time).' - '.$this->fmt($open->closing_time);
    }

    protected function buildWeeklyOff(): string
    {
        $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        $hours = $this->relationLoaded('operatingHours') ? $this->operatingHours : $this->operatingHours()->get();

        $closed = $hours->where('is_closed', true)
            ->map(fn ($h) => $days[$h->day_of_week] ?? null)
            ->filter()
            ->values();

        return $closed->isEmpty() ? 'None (Open All Days)' : $closed->implode(', ');
    }

    protected function fmt(?string $time): string
    {
        if (! $time) {
            return '';
        }

        try {
            return Carbon::parse($time)->format('g:i A');
        } catch (\Throwable) {
            return (string) $time;
        }
    }
}
