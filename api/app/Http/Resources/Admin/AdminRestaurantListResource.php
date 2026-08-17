<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Row shape for src/pages/restaurants/RestaurantList.jsx.
 */
class AdminRestaurantListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'owner_name' => $this->owner?->name,
            'mobile' => $this->phone,
            'email' => $this->email,
            'city' => $this->city,
            // Full fields the Edit modal prefills from the list row.
            'address' => trim(($this->address_line1 ?? '').' '.($this->address_line2 ?? '')),
            'commission' => (float) $this->commission_rate,
            'settlement_cycle' => $this->settlement_cycle ?? 'WEEKLY',
            'min_order' => (float) $this->min_order_value,
            'delivery_radius_km' => (int) ($this->delivery_radius_km ?? config('dastak.delivery.max_radius_km', 12)),
            'is_veg_only' => (bool) $this->is_pure_veg,
            'status' => $this->is_active ? 'ACTIVE' : 'SUSPENDED',
            'is_online' => (bool) $this->is_open,
            'total_orders' => (int) ($this->orders_count ?? $this->orders()->count()),
            'rating' => (float) $this->rating,
        ];
    }
}
