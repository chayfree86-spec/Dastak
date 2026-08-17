<?php

namespace App\Http\Requests\Delivery;

use App\Enums\VehicleType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateDeliveryProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'vehicle_type' => ['nullable', new Enum(VehicleType::class)],
            'vehicle_number' => ['nullable', 'string', 'max:30'],
            'driving_license_number' => ['nullable', 'string', 'max:50'],
            'aadhar_number' => ['nullable', 'string', 'max:20'],
            'pan_number' => ['nullable', 'string', 'max:20'],
            'bank_account_name' => ['nullable', 'string', 'max:100'],
            'bank_account_number' => ['nullable', 'string', 'max:50'],
            'bank_ifsc' => ['nullable', 'string', 'max:20'],
            'bank_upi_id' => ['nullable', 'string', 'max:50'],
        ];
    }
}
