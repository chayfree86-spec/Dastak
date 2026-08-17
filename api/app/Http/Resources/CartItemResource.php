<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'menu_item_id' => $this->menu_item_id,
            'item_name' => $this->menuItem?->name,
            'item_image' => $this->menuItem?->image,
            'food_type' => $this->menuItem?->food_type?->value ?? 'VEG',
            'variant_id' => $this->variant_id,
            'variant_name' => $this->variant?->name,
            'quantity' => (int) $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'total_price' => (float) $this->total_price,
            'instructions' => $this->instructions,
            'addons' => CartItemAddonResource::collection($this->whenLoaded('addons')),
        ];
    }
}
