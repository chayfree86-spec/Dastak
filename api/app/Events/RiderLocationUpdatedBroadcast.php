<?php

namespace App\Events;

use App\Models\RiderLocation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RiderLocationUpdatedBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public RiderLocation $location,
        public ?string $orderNumber = null
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel("rider-telemetry.{$this->location->user_id}"),
            new PrivateChannel('admin-fleet'),
        ];

        if ($this->orderNumber) {
            $channels[] = new PrivateChannel("order.{$this->orderNumber}");
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'rider.location.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'rider_id' => $this->location->user_id,
            'order_id' => $this->location->order_id,
            'order_number' => $this->orderNumber,
            'latitude' => (float) $this->location->latitude,
            'longitude' => (float) $this->location->longitude,
            'heading' => $this->location->heading,
            'speed' => $this->location->speed,
            'recorded_at' => $this->location->recorded_at->toIso8601String(),
        ];
    }
}
