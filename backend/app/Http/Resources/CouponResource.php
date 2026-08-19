<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CouponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'title' => $this->title,
            'description' => $this->description,
            'discount_type' => $this->discount_type?->value ?? (string) $this->discount_type,
            'discount_type_label' => $this->discount_type?->label() ?? 'Discount',
            'discount_value' => (float) $this->discount_value,
            'max_discount_amount' => $this->max_discount_amount !== null ? (float) $this->max_discount_amount : null,
            'max_discount' => $this->max_discount_amount !== null ? (float) $this->max_discount_amount : null,
            'min_order_value' => (float) $this->min_order_value,
            'min_order' => (float) $this->min_order_value,
            'usage_limit_per_user' => (int) $this->usage_limit_per_user,
            'total_usage_limit' => $this->total_usage_limit !== null ? (int) $this->total_usage_limit : null,
            'total_used_count' => (int) $this->total_used_count,
            'restaurant_id' => $this->restaurant_id,
            'image_url' => $this->image_url,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'is_active' => (bool) $this->is_active,
            'is_valid' => $this->isValidNow(),
        ];
    }
}
