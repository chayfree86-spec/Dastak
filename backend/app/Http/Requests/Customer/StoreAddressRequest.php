<?php

namespace App\Http\Requests\Customer;

use App\Enums\AddressType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    protected function prepareForValidation(): void
    {
        $type = $this->input('type');
        if ($type) {
            $upper = strtoupper((string) $type);
            if (in_array($upper, ['HOME', 'WORK', 'OTHER'])) {
                $type = $upper;
            } else {
                $type = 'HOME';
            }
        }

        $this->merge([
            'contact_name' => $this->input('contact_name') ?? $this->input('customer_name') ?? $this->input('name') ?? $this->user()?->name ?? 'Customer',
            'contact_mobile' => $this->input('contact_mobile') ?? $this->input('customer_phone') ?? $this->input('phone') ?? $this->input('mobile') ?? $this->user()?->mobile ?? '9876543210',
            'address_line1' => $this->input('address_line1') ?? $this->input('address') ?? 'N/A',
            'city' => $this->input('city') ?? 'Kanpur',
            'pincode' => $this->input('pincode') ?? '208001',
            'type' => $type ?? 'HOME',
        ]);
    }

    public function rules(): array
    {
        return [
            'type' => ['nullable', new Enum(AddressType::class)],
            'contact_name' => ['required', 'string', 'max:100'],
            'contact_mobile' => ['required', 'string', 'max:20'],
            'address_line1' => ['required', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'landmark' => ['nullable', 'string', 'max:150'],
            'city' => ['required', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'pincode' => ['required', 'string', 'max:10'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }
}
