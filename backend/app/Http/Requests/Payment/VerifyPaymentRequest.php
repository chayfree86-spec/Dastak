<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;

class VerifyPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'order_number' => ['required', 'exists:orders,order_number'],
            'gateway_payment_id' => ['required', 'string'],
            'gateway_signature' => ['required', 'string'],
        ];
    }
}
