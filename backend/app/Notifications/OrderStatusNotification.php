<?php

namespace App\Notifications;

use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OrderStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Order $order,
        public OrderStatus $previousStatus,
        public OrderStatus $newStatus
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $statusLabels = [
            OrderStatus::CONFIRMED->value => 'Order Confirmed by Restaurant',
            OrderStatus::PREPARING->value => 'Kitchen is Preparing Your Food',
            OrderStatus::READY_FOR_PICKUP->value => 'Order is Ready for Pickup',
            OrderStatus::OUT_FOR_DELIVERY->value => 'Order Out for Delivery',
            OrderStatus::DELIVERED->value => 'Order Delivered! Enjoy your meal',
            OrderStatus::CANCELLED->value => 'Order Cancelled',
            OrderStatus::REJECTED->value => 'Order Rejected by Restaurant',
        ];

        $title = $statusLabels[$this->newStatus->value] ?? "Order #{$this->order->order_number} Update";

        $message = match ($this->newStatus) {
            OrderStatus::PREPARING => "{$this->order->restaurant?->name} has started preparing your order.",
            OrderStatus::OUT_FOR_DELIVERY => "Our delivery partner is on the way to your doorstep. Please share OTP {$this->order->delivery_otp} upon arrival.",
            OrderStatus::DELIVERED => "Your order #{$this->order->order_number} has been delivered successfully. Please rate your food & delivery rider experience!",
            OrderStatus::CANCELLED => "Your order #{$this->order->order_number} has been cancelled.",
            default => "Your order status is now {$this->newStatus->value}.",
        };

        return [
            'type' => 'ORDER_STATUS_UPDATE',
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'status' => $this->newStatus->value,
            'delivery_otp' => $this->newStatus === OrderStatus::OUT_FOR_DELIVERY ? $this->order->delivery_otp : null,
            'title' => $title,
            'message' => $message,
            'created_at' => now()->toIso8601String(),
        ];
    }
}
