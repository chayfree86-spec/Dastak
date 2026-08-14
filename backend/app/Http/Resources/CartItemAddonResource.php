<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemAddonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'addon_id' => $this->addon_id,
            'name' => $this->addon?->name,
            'price' => (float) $this->price,
        ];
    }
}
