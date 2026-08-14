<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RestaurantSettlementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'settlement_number' => $this->settlement_number,
            'restaurant_id' => $this->restaurant_id,
            'restaurant_name' => $this->restaurant?->name,
            'period_start' => $this->period_start?->toDateString(),
            'period_end' => $this->period_end?->toDateString(),
            'total_orders_count' => (int) $this->total_orders_count,
            'gross_sales' => (float) $this->gross_sales,
            'platform_commission' => (float) $this->platform_commission,
            'tax_deducted' => (float) $this->tax_deducted,
            'net_payable' => (float) $this->net_payable,
            'status' => $this->status?->value ?? (string) $this->status,
            'payout_method' => $this->payout_method?->value,
            'payout_reference' => $this->payout_reference,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'processed_by' => $this->processedByAdmin?->name,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
