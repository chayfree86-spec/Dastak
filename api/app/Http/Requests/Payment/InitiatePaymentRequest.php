<?php

namespace App\Http\Requests\Payment;

use App\Enums\PaymentGateway;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class InitiatePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'order_number' => ['required', 'exists:orders,order_number'],
            'gateway' => ['nullable', new Enum(PaymentGateway::class)],
        ];
    }
}
