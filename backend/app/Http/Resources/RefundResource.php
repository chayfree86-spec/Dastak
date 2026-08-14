<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RefundResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payment_id' => $this->payment_id,
            'order_id' => $this->order_id,
            'order_number' => $this->order?->order_number,
            'refund_transaction_id' => $this->refund_transaction_id,
            'amount' => (float) $this->amount,
            'reason' => $this->reason,
            'status' => $this->status?->value ?? (string) $this->status,
            'gateway_refund_id' => $this->gateway_refund_id,
            'processed_at' => $this->processed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
