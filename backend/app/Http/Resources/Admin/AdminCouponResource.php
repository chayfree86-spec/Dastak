<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Coupon row shape for src/pages/marketing/CouponList.jsx.
 * The UI uses FLAT (backend stores FIXED) and flat field names.
 */
class AdminCouponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $type = $this->discount_type?->value ?? (string) $this->discount_type;

        return [
            'id' => $this->id,
            'code' => $this->code,
            'discount_type' => $type === 'FIXED' ? 'FLAT' : 'PERCENTAGE',
            'discount_value' => (float) $this->discount_value,
            'min_order' => (float) $this->min_order_value,
            'max_discount' => $this->max_discount_amount !== null ? (float) $this->max_discount_amount : null,
            'start_date' => $this->starts_at?->toDateString(),
            'end_date' => $this->expires_at?->toDateString(),
            'usage_limit' => (int) $this->total_usage_limit,
            'used_count' => (int) $this->total_used_count,
            'user_limit' => (int) $this->usage_limit_per_user,
            'image_url' => $this->image_url,
            'is_active' => (bool) $this->is_active,
        ];
    }
}
