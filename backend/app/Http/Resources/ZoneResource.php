<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ZoneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'city' => $this->city,
            'center_latitude' => $this->center_latitude !== null ? (float) $this->center_latitude : null,
            'center_longitude' => $this->center_longitude !== null ? (float) $this->center_longitude : null,
            'radius_km' => (float) $this->radius_km,
            'boundary_coordinates' => $this->boundary_coordinates,
            'is_active' => (bool) $this->is_active,
            'restaurants_count' => $this->whenCounted('restaurants'),
        ];
    }
}
