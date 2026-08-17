<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OrderPlacedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Order $order,
        public string $recipientRole = 'CUSTOMER' // CUSTOMER, RESTAURANT, ADMIN
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $title = match ($this->recipientRole) {
            'RESTAURANT' => "New Order #{$this->order->order_number} Received!",
            'ADMIN' => "New Platform Order #{$this->order->order_number} Placed",
            default => "Order #{$this->order->order_number} Placed Successfully!",
        };

        $message = match ($this->recipientRole) {
            'RESTAURANT' => "You have received a new order for {$this->order->items->count()} items. Total: ₹{$this->order->subtotal}.",
            'ADMIN' => "Customer {$this->order->customer?->name} ordered from {$this->order->restaurant?->name}. Amount: ₹{$this->order->total_amount}.",
            default => "Thank you for ordering with Dastak! Your food from {$this->order->restaurant?->name} will be prepared shortly.",
        };

        return [
            'type' => 'ORDER_PLACED',
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'restaurant_id' => $this->order->restaurant_id,
            'restaurant_name' => $this->order->restaurant?->name,
            'total_amount' => (float) $this->order->total_amount,
            'title' => $title,
            'message' => $message,
            'created_at' => now()->toIso8601String(),
        ];
    }
}
