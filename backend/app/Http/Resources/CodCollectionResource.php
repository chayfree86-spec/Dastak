<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CodCollectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'order_number' => $this->order?->order_number,
            'delivery_boy_name' => $this->deliveryBoy?->name,
            'delivery_boy_mobile' => $this->deliveryBoy?->mobile,
            'amount' => (float) $this->amount,
            'status' => $this->status?->value ?? (string) $this->status,
            'deposited_at' => $this->deposited_at?->toIso8601String(),
            'verified_by' => $this->verifiedByAdmin?->name,
            'verified_at' => $this->verified_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
