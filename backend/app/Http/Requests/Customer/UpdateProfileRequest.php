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
            'name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'email' => ['sometimes', 'nullable', 'email', 'max:150'],
            'avatar' => ['nullable'],
            'gender' => ['nullable', 'string', 'in:MALE,FEMALE,OTHER,PREFER_NOT_TO_SAY,Male,Female,Other,Prefer not to say'],
            'dietary_preference' => ['nullable', 'string', 'max:50'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'anniversary_date' => ['nullable', 'date'],
            'alternate_mobile' => ['nullable', 'string', 'max:20'],
            'preferences' => ['nullable', 'array'],
            'taste_preferences' => ['nullable', 'array'],
        ];
    }
}
