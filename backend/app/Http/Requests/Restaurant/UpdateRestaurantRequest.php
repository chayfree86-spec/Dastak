<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRestaurantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'phone' => ['sometimes', 'required', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:150'],
            'address_line1' => ['sometimes', 'required', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'required', 'string', 'max:100'],
            'pincode' => ['sometimes', 'required', 'string', 'max:10'],
            'latitude' => ['sometimes', 'required', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'required', 'numeric', 'between:-180,180'],
            'commission_rate' => ['nullable', 'numeric', 'between:0,100'],
            'fssai_license_number' => ['nullable', 'string', 'max:50'],
            'gst_number' => ['nullable', 'string', 'max:30'],
            'is_pure_veg' => ['nullable', 'boolean'],
            'is_open' => ['nullable', 'boolean'],
            'preparation_time_minutes' => ['nullable', 'integer', 'min:5', 'max:180'],
            'min_order_value' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
