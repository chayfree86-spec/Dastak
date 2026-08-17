<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuItemVariantGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'min_selection' => (int) $this->min_selection,
            'max_selection' => (int) $this->max_selection,
            'is_required' => (bool) $this->is_required,
            'sort_order' => (int) $this->sort_order,
            'variants' => MenuItemVariantResource::collection($this->whenLoaded('variants')),
        ];
    }
}
