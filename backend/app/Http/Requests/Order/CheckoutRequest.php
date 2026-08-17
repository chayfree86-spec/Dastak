<?php

namespace App\Http\Requests\Order;

use App\Enums\PaymentMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'delivery_address_id' => ['nullable'],
            'delivery_address_json' => ['nullable', 'array'],
            'restaurant_id' => ['nullable', 'integer'],
            'items' => ['nullable', 'array'],
            'items.*.menu_item_id' => ['nullable', 'integer'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'payment_mode' => ['required', new Enum(PaymentMode::class)],
            'special_instructions' => ['nullable', 'string', 'max:255'],
        ];
    }
}
