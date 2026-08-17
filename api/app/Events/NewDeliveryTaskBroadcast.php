<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewDeliveryTaskBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Order $order,
        public int $riderId
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("rider.{$this->riderId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'rider.new.task';
    }

    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'restaurant_name' => $this->order->restaurant?->name,
            'restaurant_address' => $this->order->restaurant?->address_line1,
            'restaurant_latitude' => (float) $this->order->restaurant?->latitude,
            'restaurant_longitude' => (float) $this->order->restaurant?->longitude,
            'delivery_address' => $this->order->delivery_address_json,
            'total_amount' => (float) $this->order->total_amount,
            'payment_mode' => $this->order->payment_mode?->value,
            'assigned_at' => now()->toIso8601String(),
        ];
    }
}
