<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewOrderReceivedBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Order $order
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("restaurant.{$this->order->restaurant_id}"),
            new PrivateChannel('admin-orders'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'restaurant.new.order';
    }

    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'restaurant_id' => $this->order->restaurant_id,
            'items_count' => $this->order->items->count(),
            'subtotal' => (float) $this->order->subtotal,
            'total_amount' => (float) $this->order->total_amount,
            'customer_name' => $this->order->customer?->name,
            'placed_at' => $this->order->placed_at?->toIso8601String(),
            'sound' => 'kitchen_bell.mp3',
        ];
    }
}
