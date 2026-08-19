<?php

namespace App\Http\Requests\Customer;

use App\Enums\AddressType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    protected function prepareForValidation(): void
    {
        $merge = [];
        if ($this->has('customer_name') || $this->has('name')) {
            $merge['contact_name'] = $this->input('contact_name') ?? $this->input('customer_name') ?? $this->input('name');
        }
        if ($this->has('customer_phone') || $this->has('phone') || $this->has('mobile')) {
            $merge['contact_mobile'] = $this->input('contact_mobile') ?? $this->input('customer_phone') ?? $this->input('phone') ?? $this->input('mobile');
        }
        if ($this->has('address')) {
            $merge['address_line1'] = $this->input('address');
        }
        if ($this->has('type')) {
            $upper = strtoupper((string) $this->input('type'));
            $merge['type'] = in_array($upper, ['HOME', 'WORK', 'OTHER']) ? $upper : 'HOME';
        }

        if (! empty($merge)) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        return [
            'type' => ['nullable', new Enum(AddressType::class)],
            'contact_name' => ['sometimes', 'required', 'string', 'max:100'],
            'contact_mobile' => ['sometimes', 'required', 'string', 'max:20'],
            'address_line1' => ['sometimes', 'required', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'landmark' => ['nullable', 'string', 'max:150'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:10'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }
}
