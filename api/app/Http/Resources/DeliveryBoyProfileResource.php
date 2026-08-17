<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryBoyProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'vehicle_type' => $this->vehicle_type?->value ?? (string) $this->vehicle_type,
            'vehicle_type_label' => $this->vehicle_type?->label() ?? 'Motorcycle',
            'vehicle_number' => $this->vehicle_number,
            'driving_license_number' => $this->driving_license_number,
            'aadhar_number' => $this->aadhar_number,
            'pan_number' => $this->pan_number,
            'bank_account_name' => $this->bank_account_name,
            'bank_account_number' => $this->bank_account_number,
            'bank_ifsc' => $this->bank_ifsc,
            'bank_upi_id' => $this->bank_upi_id,
            'is_online' => (bool) $this->is_online,
            'is_busy' => (bool) $this->is_busy,
            'current_latitude' => $this->current_latitude !== null ? (float) $this->current_latitude : null,
            'current_longitude' => $this->current_longitude !== null ? (float) $this->current_longitude : null,
            'last_location_updated_at' => $this->last_location_updated_at?->toIso8601String(),
            'rating' => (float) $this->rating,
            'total_deliveries' => (int) $this->total_deliveries,
            'pending_cod_amount' => (float) $this->pending_cod_amount,
            'total_earned_amount' => (float) $this->total_earned_amount,
        ];
    }
}
