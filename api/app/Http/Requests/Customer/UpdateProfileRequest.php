<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'gender' => ['nullable', 'string', 'in:MALE,FEMALE,OTHER'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'alternate_mobile' => ['nullable', 'string', 'max:20'],
            'preferences' => ['nullable', 'array'],
        ];
    }
}
