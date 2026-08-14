<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'order_number' => $this->order?->order_number,
            'customer_name' => $this->customer?->name,
            'restaurant_id' => $this->restaurant_id,
            'restaurant_name' => $this->restaurant?->name,
            'delivery_boy_id' => $this->delivery_boy_id,
            'delivery_boy_name' => $this->deliveryBoy?->name,
            'food_rating' => (int) $this->food_rating,
            'delivery_rating' => $this->delivery_rating !== null ? (int) $this->delivery_rating : null,
            'comment' => $this->comment,
            'restaurant_reply' => $this->restaurant_reply,
            'restaurant_replied_at' => $this->restaurant_replied_at?->toIso8601String(),
            'is_visible' => (bool) $this->is_visible,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
