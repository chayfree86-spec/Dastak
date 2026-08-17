<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'restaurant_id' => $this->restaurant_id,
            'restaurant_name' => $this->restaurant?->name,
            'restaurant_slug' => $this->restaurant?->slug,
            'restaurant_phone' => $this->restaurant?->phone,
            'delivery_address' => new AddressResource($this->whenLoaded('deliveryAddress')),
            'applied_coupon' => new CouponResource($this->whenLoaded('coupon')),
            'items' => CartItemResource::collection($this->whenLoaded('items')),
            'items_count' => $this->items ? $this->items->sum('quantity') : 0,
            
            // Financial Breakdown
            'bill' => [
                'subtotal' => (float) $this->subtotal,
                'discount_amount' => (float) $this->discount_amount,
                'delivery_fee' => (float) $this->delivery_fee,
                'tax_amount' => (float) $this->tax_amount,
                'total_amount' => (float) $this->total_amount,
            ],
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
