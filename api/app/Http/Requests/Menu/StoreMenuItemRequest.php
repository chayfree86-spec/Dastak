<?php

namespace App\Http\Requests\Menu;

use App\Enums\FoodType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'exists:menu_categories,id'],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'discount_price' => ['nullable', 'numeric', 'min:0'],
            'food_type' => ['required', new Enum(FoodType::class)],
            'is_available' => ['nullable', 'boolean'],
            'is_recommended' => ['nullable', 'boolean'],
            'preparation_time_minutes' => ['nullable', 'integer', 'min:1'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            
            // Nested Variant Groups
            'variant_groups' => ['nullable', 'array'],
            'variant_groups.*.name' => ['required', 'string', 'max:100'],
            'variant_groups.*.min_selection' => ['nullable', 'integer', 'min:0'],
            'variant_groups.*.max_selection' => ['nullable', 'integer', 'min:1'],
            'variant_groups.*.is_required' => ['nullable', 'boolean'],
            'variant_groups.*.variants' => ['required', 'array', 'min:1'],
            'variant_groups.*.variants.*.name' => ['required', 'string', 'max:100'],
            'variant_groups.*.variants.*.price' => ['required', 'numeric', 'min:0'],
            'variant_groups.*.variants.*.is_default' => ['nullable', 'boolean'],
            
            // Nested Addon Groups
            'addon_groups' => ['nullable', 'array'],
            'addon_groups.*.name' => ['required', 'string', 'max:100'],
            'addon_groups.*.min_selection' => ['nullable', 'integer', 'min:0'],
            'addon_groups.*.max_selection' => ['nullable', 'integer', 'min:1'],
            'addon_groups.*.addons' => ['required', 'array', 'min:1'],
            'addon_groups.*.addons.*.name' => ['required', 'string', 'max:100'],
            'addon_groups.*.addons.*.price' => ['required', 'numeric', 'min:0'],
        ];
    }
}
