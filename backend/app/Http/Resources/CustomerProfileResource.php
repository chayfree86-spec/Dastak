<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'gender' => $this->gender,
            'dietary_preference' => $this->dietary_preference,
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'anniversary_date' => $this->anniversary_date?->format('Y-m-d'),
            'alternate_mobile' => $this->alternate_mobile,
            'loyalty_points' => (int) $this->loyalty_points,
            'preferences' => $this->preferences ?? [],
            'taste_preferences' => $this->taste_preferences ?? [],
            'completion_percentage' => $this->completion_percentage,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
