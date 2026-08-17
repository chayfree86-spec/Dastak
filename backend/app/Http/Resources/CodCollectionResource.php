<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CodCollectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $order = $this->order;
        $customerAddress = $order?->delivery_address_json ?? [];

        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'order_number' => $order?->order_number ?? ("#".$this->order_id),
            'amount' => (float) $this->amount,
            'status' => $this->status?->value ?? (string) $this->status,
            'status_label' => match ($this->status?->value ?? (string) $this->status) {
                'COLLECTED' => 'Cash in Hand (Pending Deposit)',
                'DEPOSITED_TO_OFFICE' => 'Submitted to Hub',
                'VERIFIED' => 'Verified by Office',
                default => 'Collected',
            },
            'customer' => [
                'name' => $customerAddress['customer_name'] ?? $order?->customer?->name ?? 'Customer',
                'phone' => $customerAddress['customer_phone'] ?? $order?->customer?->mobile ?? null,
                'address' => $customerAddress['address'] ?? 'Customer Delivery Address',
                'landmark' => $customerAddress['landmark'] ?? null,
            ],
            'restaurant' => [
                'id' => $order?->restaurant?->id,
                'name' => $order?->restaurant?->name ?? 'Partner Kitchen',
                'phone' => $order?->restaurant?->phone,
                'address' => $order?->restaurant?->address_line1,
            ],
            'items' => $order?->items?->map(fn ($item) => [
                'name' => $item->item_name,
                'quantity' => (int) $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'total_price' => (float) $item->total_price,
            ])->values()->all() ?? [],
            'items_count' => (int) ($order?->items?->count() ?? 0),
            'bill' => [
                'subtotal' => (float) ($order?->subtotal ?? 0),
                'delivery_fee' => (float) ($order?->delivery_fee ?? 0),
                'tax_amount' => (float) ($order?->tax_amount ?? 0),
                'total_amount' => (float) ($order?->total_amount ?? $this->amount),
            ],
            'deposited_at' => $this->deposited_at?->toIso8601String(),
            'verified_by' => $this->verifiedByAdmin?->name,
            'verified_at' => $this->verified_at?->toIso8601String(),
            'delivered_at' => $order?->delivered_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
