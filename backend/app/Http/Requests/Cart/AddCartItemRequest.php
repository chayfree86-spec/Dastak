<?php

namespace App\Http\Requests\Cart;

use Illuminate\Foundation\Http\FormRequest;

class AddCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'restaurant_id' => ['required', 'exists:restaurants,id'],
            'menu_item_id' => ['required', 'exists:menu_items,id'],
            'variant_id' => ['nullable', 'exists:menu_item_variants,id'],
            'addon_ids' => ['nullable', 'array'],
            'addon_ids.*' => ['integer', 'exists:menu_item_addons,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:50'],
            'instructions' => ['nullable', 'string', 'max:255'],
            'force_clear' => ['nullable', 'boolean'],
        ];
    }
}
