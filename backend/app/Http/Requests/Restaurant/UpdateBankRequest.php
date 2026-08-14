<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBankRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'bank_name' => ['required', 'string', 'max:100'],
            'account_holder_name' => ['required', 'string', 'max:100'],
            'account_number' => ['required', 'string', 'max:50'],
            'ifsc_code' => ['required', 'string', 'max:20'],
            'upi_id' => ['nullable', 'string', 'max:50'],
        ];
    }
}
