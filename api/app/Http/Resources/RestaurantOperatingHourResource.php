<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RestaurantOperatingHourResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        return [
            'id' => $this->id,
            'day_of_week' => (int) $this->day_of_week,
            'day_name' => $days[$this->day_of_week] ?? 'Day',
            'opening_time' => $this->opening_time,
            'closing_time' => $this->closing_time,
            'is_closed' => (bool) $this->is_closed,
        ];
    }
}
