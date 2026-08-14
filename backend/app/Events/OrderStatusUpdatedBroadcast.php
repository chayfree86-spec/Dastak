<?php

namespace App\Events;

use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdatedBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Order $order,
        public OrderStatus $previousStatus,
        public OrderStatus $newStatus
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("order.{$this->order->order_number}"),
            new PrivateChannel('admin-orders'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.status.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'previous_status' => $this->previousStatus->value,
            'new_status' => $this->newStatus->value,
            'delivery_otp' => $this->newStatus === OrderStatus::OUT_FOR_DELIVERY ? $this->order->delivery_otp : null,
            'updated_at' => now()->toIso8601String(),
        ];
    }
}
