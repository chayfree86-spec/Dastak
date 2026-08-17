<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RiderAssignedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Order $order,
        public string $recipientRole = 'RIDER' // RIDER or CUSTOMER
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        if ($this->recipientRole === 'RIDER') {
            return [
                'type' => 'NEW_DELIVERY_TASK',
                'order_id' => $this->order->id,
                'order_number' => $this->order->order_number,
                'restaurant_name' => $this->order->restaurant?->name,
                'restaurant_address' => $this->order->restaurant?->address_line1,
                'delivery_address' => $this->order->delivery_address_json,
                'title' => "New Delivery Assigned: #{$this->order->order_number}",
                'message' => "Pick up from {$this->order->restaurant?->name} and deliver to customer.",
                'created_at' => now()->toIso8601String(),
            ];
        }

        return [
            'type' => 'RIDER_ASSIGNED',
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'rider_name' => $this->order->deliveryBoy?->name,
            'rider_mobile' => $this->order->deliveryBoy?->mobile,
            'title' => 'Delivery Partner Assigned',
            'message' => "{$this->order->deliveryBoy?->name} has been assigned to deliver your order.",
            'created_at' => now()->toIso8601String(),
        ];
    }
}
