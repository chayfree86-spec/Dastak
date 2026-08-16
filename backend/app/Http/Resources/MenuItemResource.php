<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'restaurant_id' => $this->restaurant_id,
            'category_id' => $this->category_id,
            'category_name' => $this->category?->name,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'image' => $this->image
                ? (str_starts_with($this->image, 'http') ? $this->image : asset('storage/'.ltrim($this->image, '/')))
                : null,
            'base_price' => (float) $this->base_price,
            'discount_price' => $this->discount_price !== null ? (float) $this->discount_price : null,
            'food_type' => $this->food_type?->value ?? (string) $this->food_type,
            'food_type_label' => $this->food_type?->label() ?? 'Vegetarian',
            'is_available' => (bool) $this->is_available,
            'is_recommended' => (bool) $this->is_recommended,
            'preparation_time_minutes' => (int) $this->preparation_time_minutes,
            'sort_order' => (int) $this->sort_order,
            'variant_groups' => MenuItemVariantGroupResource::collection($this->whenLoaded('variantGroups')),
            'addon_groups' => MenuItemAddonGroupResource::collection($this->whenLoaded('addonGroups')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
