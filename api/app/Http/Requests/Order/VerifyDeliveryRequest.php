<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class VerifyDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'otp' => ['required', 'string', 'min:4', 'max:6'],
        ];
    }
}
