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
            'delivery_address_id' => ['nullable', 'exists:addresses,id'],
            'payment_mode' => ['required', new Enum(PaymentMode::class)],
            'special_instructions' => ['nullable', 'string', 'max:255'],
        ];
    }
}
