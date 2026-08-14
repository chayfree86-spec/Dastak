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
            'city' => $this->city,
            'commission' => (float) $this->commission_rate,
            'settlement_cycle' => $this->settlement_cycle ?? 'WEEKLY',
            'status' => $this->is_active ? 'ACTIVE' : 'SUSPENDED',
            'is_online' => (bool) $this->is_open,
            'total_orders' => (int) ($this->orders_count ?? $this->orders()->count()),
            'rating' => (float) $this->rating,
        ];
    }
}
