<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'restaurant_id' => $this->restaurant_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'image' => $this->image,
            'sort_order' => (int) $this->sort_order,
            'is_active' => (bool) $this->is_active,
            'items_count' => $this->whenCounted('items'),
            'items' => MenuItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
