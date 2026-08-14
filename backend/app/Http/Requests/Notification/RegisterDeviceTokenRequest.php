<?php

namespace App\Http\Requests\Notification;

use App\Enums\DeviceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class RegisterDeviceTokenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'fcm_token' => ['required', 'string', 'max:255'],
            'device_type' => ['nullable', new Enum(DeviceType::class)],
        ];
    }
}
