<?php

namespace App\Listeners;

use App\Enums\OrderStatus;
use App\Events\OrderPlacedEvent;
use App\Events\OrderStatusUpdatedEvent;
use App\Events\RiderAssignedEvent;
use App\Notifications\OrderPlacedNotification;
use App\Notifications\OrderStatusNotification;
use App\Notifications\RiderAssignedNotification;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendOrderNotifications
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    public function handleOrderPlaced(OrderPlacedEvent $event): void
    {
        $order = $event->order;

        // 1. Notify Customer
        if ($order->customer) {
            $order->customer->notify(new OrderPlacedNotification($order, 'CUSTOMER'));
            $this->notificationService->sendPushNotification(
                user: $order->customer,
                title: "Order #{$order->order_number} Confirmed!",
                body: "Your order from {$order->restaurant?->name} has been received.",
                data: ['order_id' => $order->id, 'order_number' => $order->order_number]
            );

            if ($order->customer->mobile) {
                $this->notificationService->sendSmsOrWhatsApp(
                    recipient: $order->customer->mobile,
                    messageBody: "Dastak: Your order #{$order->order_number} of Rs. {$order->total_amount} is placed with {$order->restaurant?->name}.",
                    channel: 'SMS',
                    user: $order->customer,
                    templateName: 'ORDER_PLACED_CUSTOMER'
                );
            }
        }

        // 2. Notify Restaurant Owner
        $owner = $order->restaurant?->owner;
        if ($owner) {
            $owner->notify(new OrderPlacedNotification($order, 'RESTAURANT'));
            $this->notificationService->sendPushNotification(
                user: $owner,
                title: "New Order #{$order->order_number} Received!",
                body: "Items count: {$order->items->count()} | Total: Rs. {$order->subtotal}",
                data: ['order_id' => $order->id, 'sound' => 'order_bell.mp3']
            );
        }

        // 3. Real-Time WebSocket Broadcast to Restaurant Kitchen Channel
        event(new \App\Events\NewOrderReceivedBroadcast($order));
    }

    public function handleOrderStatusUpdated(OrderStatusUpdatedEvent $event): void
    {
        $order = $event->order;
        $customer = $order->customer;

        // Broadcast WebSocket update to Customer live map
        event(new \App\Events\OrderStatusUpdatedBroadcast($order, $event->previousStatus, $event->newStatus));

        if ($customer) {
            $customer->notify(new OrderStatusNotification($order, $event->previousStatus, $event->newStatus));
            
            $pushTitle = "Order #{$order->order_number} Status Update";
            $pushBody = "Your order is now {$event->newStatus->value}.";

            if ($event->newStatus === OrderStatus::OUT_FOR_DELIVERY) {
                $pushBody = "Your rider is on the way! Give delivery OTP: {$order->delivery_otp}";
                
                if ($customer->mobile) {
                    $this->notificationService->sendSmsOrWhatsApp(
                        recipient: $customer->mobile,
                        messageBody: "Dastak Delivery: Your order is out for delivery. Share OTP {$order->delivery_otp} with your rider to receive food.",
                        channel: 'SMS',
                        user: $customer,
                        templateName: 'OUT_FOR_DELIVERY_OTP'
                    );
                }
            }

            $this->notificationService->sendPushNotification(
                user: $customer,
                title: $pushTitle,
                body: $pushBody,
                data: ['order_id' => $order->id, 'status' => $event->newStatus->value]
            );
        }
    }

    public function handleRiderAssigned(RiderAssignedEvent $event): void
    {
        $order = $event->order;
        $rider = $event->rider;

        // 1. Notify Rider
        $rider->notify(new RiderAssignedNotification($order, 'RIDER'));
        $this->notificationService->sendPushNotification(
            user: $rider,
            title: "New Delivery Task Assigned: #{$order->order_number}",
            body: "Pick up from {$order->restaurant?->name} ({$order->restaurant?->address_line1})",
            data: ['order_id' => $order->id, 'action' => 'PICKUP_ORDER']
        );

        // Real-Time WebSocket Broadcast to Rider channel
        event(new \App\Events\NewDeliveryTaskBroadcast($order, $rider->id));

        // 2. Notify Customer
        if ($order->customer) {
            $order->customer->notify(new RiderAssignedNotification($order, 'CUSTOMER'));
            $this->notificationService->sendPushNotification(
                user: $order->customer,
                title: 'Rider Assigned',
                body: "{$rider->name} has been assigned to deliver your order.",
                data: ['order_id' => $order->id, 'rider_name' => $rider->name]
            );
        }
    }

    public function subscribe($events): array
    {
        return [
            OrderPlacedEvent::class => 'handleOrderPlaced',
            OrderStatusUpdatedEvent::class => 'handleOrderStatusUpdated',
            RiderAssignedEvent::class => 'handleRiderAssigned',
        ];
    }
}
