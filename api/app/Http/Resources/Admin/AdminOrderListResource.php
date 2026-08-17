<?php

namespace App\Http\Resources\Admin;

use App\Support\AdminOrderMap;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Row shape consumed by the admin OrderList / Dashboard tables.
 * Matches src/pages/orders/OrderList.jsx column keys exactly.
 */
class AdminOrderListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer' => $this->customer?->name ?? 'Guest',
            'restaurant' => $this->restaurant?->name ?? '—',
            'amount' => (float) $this->total_amount,
            'payment' => AdminOrderMap::paymentToFrontend($this->payment_mode),
            'status' => AdminOrderMap::statusToFrontend($this->status),
            'delivery_boy' => $this->deliveryBoy?->name ?? 'Unassigned',
            'time' => ($this->placed_at ?? $this->created_at)?->toIso8601String(),
        ];
    }
}
