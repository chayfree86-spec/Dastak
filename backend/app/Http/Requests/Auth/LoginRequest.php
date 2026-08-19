<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (!$this->has('identifier')) {
            $identifier = $this->input('login') ?? $this->input('email') ?? $this->input('mobile');
            if ($identifier) {
                $this->merge(['identifier' => (string)$identifier]);
            }
        }
        if (!$this->has('password') && $this->has('pin')) {
            $this->merge(['password' => (string)$this->input('pin')]);
        }
    }

    public function rules(): array
    {
        return [
            'identifier' => ['required', 'string'], // email or mobile
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'identifier.required' => 'Email or mobile number is required.',
            'password.required' => 'Password or PIN is required.',
        ];
    }
}
