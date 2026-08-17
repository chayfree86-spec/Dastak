<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOperatingHoursRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'hours' => ['required', 'array', 'min:1', 'max:7'],
            'hours.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'hours.*.opening_time' => ['required', 'date_format:H:i:s,H:i'],
            'hours.*.closing_time' => ['required', 'date_format:H:i:s,H:i'],
            'hours.*.is_closed' => ['nullable', 'boolean'],
        ];
    }
}
