<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemAddonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'addon_id' => $this->addon_id,
            'addon_name' => $this->addon_name,
            'price' => (float) $this->price,
        ];
    }
}
