<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRestaurantStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'is_active' => ['required', 'boolean'],
            'commission_rate' => ['nullable', 'numeric', 'between:0,100'],
        ];
    }
}
