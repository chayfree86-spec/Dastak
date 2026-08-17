<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuItemAddonGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'min_selection' => (int) $this->min_selection,
            'max_selection' => (int) $this->max_selection,
            'sort_order' => (int) $this->sort_order,
            'addons' => MenuItemAddonResource::collection($this->whenLoaded('addons')),
        ];
    }
}
