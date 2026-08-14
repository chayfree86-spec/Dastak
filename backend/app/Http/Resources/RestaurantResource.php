<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RestaurantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'logo' => $this->logo,
            'banner' => $this->banner,
            'phone' => $this->phone,
            'email' => $this->email,
            'address_line1' => $this->address_line1,
            'address_line2' => $this->address_line2,
            'city' => $this->city,
            'pincode' => $this->pincode,
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
            'distance_km' => isset($this->distance) ? round((float) $this->distance, 2) : null,
            'commission_rate' => (float) $this->commission_rate,
            'fssai_license_number' => $this->fssai_license_number,
            'gst_number' => $this->gst_number,
            'is_pure_veg' => (bool) $this->is_pure_veg,
            'is_open' => (bool) $this->is_open,
            'is_active' => (bool) $this->is_active,
            'preparation_time_minutes' => (int) $this->preparation_time_minutes,
            'min_order_value' => (float) $this->min_order_value,
            'rating' => (float) $this->rating,
            'total_ratings' => (int) $this->total_ratings,
            'zone' => new ZoneResource($this->whenLoaded('zone')),
            'operating_hours' => RestaurantOperatingHourResource::collection($this->whenLoaded('operatingHours')),
            'bank_account' => new RestaurantBankAccountResource($this->whenLoaded('bankAccount')),
            'owner' => new UserResource($this->whenLoaded('owner')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
