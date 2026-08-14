<?php

namespace App\Http\Requests\Support;

use App\Enums\TicketCategory;
use App\Enums\TicketPriority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'subject' => ['required', 'string', 'max:190'],
            'category' => ['nullable', new Enum(TicketCategory::class)],
            'priority' => ['nullable', new Enum(TicketPriority::class)],
            'order_id' => ['nullable', 'exists:orders,id'],
            'message' => ['required', 'string', 'max:5000'],
            'attachment_url' => ['nullable', 'string', 'max:255'],
        ];
    }
}
