<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;

class DepositCodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'collection_ids' => ['required', 'array', 'min:1'],
            'collection_ids.*' => ['integer', 'exists:cod_collections,id'],
        ];
    }
}
