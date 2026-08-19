<?php

namespace App\Http\Requests\Admin;

use App\Enums\DiscountType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreCouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', 'unique:coupons,code'],
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'discount_type' => ['required', new Enum(DiscountType::class)],
            'discount_value' => ['required', 'numeric', 'min:1'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:1'],
            'min_order_value' => ['nullable', 'numeric', 'min:0'],
            'usage_limit_per_user' => ['nullable', 'integer', 'min:1'],
            'total_usage_limit' => ['nullable', 'integer', 'min:1'],
            'restaurant_id' => ['nullable', 'exists:restaurants,id'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'image_url' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
