<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\MenuItemAddon;
use App\Models\MenuItemVariant;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemAddon;
use App\Models\OrderStatusHistory;
use App\Models\Restaurant;
use App\Models\User;
use App\Enums\UserRole;
use Illuminate\Database\Seeder;

/**
 * Seeds a spread of demo orders across the pipeline so the admin panel
 * (orders list, dashboard, finance) has realistic data to render.
 */
class DemoOrdersSeeder extends Seeder
{
    public function run(): void
    {
        $restaurant = Restaurant::where('name', 'Dastak Biryani Mahal')->first();
        $customer = User::where('email', 'priya@gmail.com')->first();
        $rider = User::where('email', 'rahul.rider@dastakdelivery.com')->first();
        $item = $restaurant ? MenuItem::where('restaurant_id', $restaurant->id)->first() : null;

        if (! $restaurant || ! $customer || ! $item) {
            $this->command?->warn('DemoOrdersSeeder: base data missing; run DastakMasterDatabaseSeeder first.');
            return;
        }

        $variant = MenuItemVariant::whereHas('group', fn ($q) => $q->where('menu_item_id', $item->id))->first();
        $addon = MenuItemAddon::whereHas('group', fn ($q) => $q->where('menu_item_id', $item->id))->first();

        $address = [
            'contact_name' => $customer->name,
            'contact_mobile' => $customer->mobile,
            'address_line1' => 'Flat 402, Ganga Heights, Civil Lines',
            'landmark' => 'Near Phool Bagh',
            'city' => 'Kanpur',
            'pincode' => '208001',
        ];

        // status, payment_mode, payment_status, minutesAgo, assign rider?
        $blueprints = [
            ['PENDING', 'ONLINE', 'PAID', 5, false],
            ['CONFIRMED', 'COD', 'PENDING', 18, false],
            ['PREPARING', 'ONLINE', 'PAID', 32, false],
            ['OUT_FOR_DELIVERY', 'ONLINE', 'PAID', 48, true],
            ['DELIVERED', 'COD', 'PAID', 90, true],
            ['CANCELLED', 'ONLINE', 'REFUNDED', 130, false],
        ];

        foreach ($blueprints as $idx => [$status, $mode, $payStatus, $minsAgo, $assignRider]) {
            $orderNumber = 'DSTK'.now()->format('ymd').str_pad((string) ($idx + 1), 3, '0', STR_PAD_LEFT);

            if (Order::where('order_number', $orderNumber)->exists()) {
                continue;
            }

            $unit = (float) ($variant->price ?? $item->base_price);
            $qty = 2;
            $subtotal = $unit * $qty;
            $discount = $idx % 2 === 0 ? 50.00 : 0.00;
            $deliveryFee = 35.00;
            $tax = round($subtotal * 0.05, 2);
            $total = $subtotal - $discount + $deliveryFee + $tax;
            $commissionRate = (float) $restaurant->commission_rate;
            $commission = round($subtotal * $commissionRate / 100, 2);

            $placedAt = now()->subMinutes($minsAgo);

            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => $customer->id,
                'restaurant_id' => $restaurant->id,
                'delivery_boy_id' => $assignRider && $rider ? $rider->id : null,
                'status' => $status,
                'payment_status' => $payStatus,
                'payment_mode' => $mode,
                'subtotal' => $subtotal,
                'discount_amount' => $discount,
                'delivery_fee' => $deliveryFee,
                'tax_amount' => $tax,
                'total_amount' => $total,
                'commission_rate' => $commissionRate,
                'commission_amount' => $commission,
                'restaurant_payout_amount' => $subtotal - $commission,
                'delivery_address_json' => $address,
                'special_instructions' => 'Please ring the bell twice.',
                'delivery_otp' => (string) random_int(1000, 9999),
                'estimated_delivery_minutes' => 35,
                'placed_at' => $placedAt,
                'confirmed_at' => in_array($status, ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED']) ? $placedAt->copy()->addMinutes(2) : null,
                'preparing_at' => in_array($status, ['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED']) ? $placedAt->copy()->addMinutes(6) : null,
                'ready_at' => in_array($status, ['OUT_FOR_DELIVERY', 'DELIVERED']) ? $placedAt->copy()->addMinutes(20) : null,
                'dispatched_at' => in_array($status, ['OUT_FOR_DELIVERY', 'DELIVERED']) ? $placedAt->copy()->addMinutes(24) : null,
                'delivered_at' => $status === 'DELIVERED' ? $placedAt->copy()->addMinutes(45) : null,
                'cancelled_at' => $status === 'CANCELLED' ? $placedAt->copy()->addMinutes(4) : null,
                'cancellation_reason' => $status === 'CANCELLED' ? 'Customer requested cancellation.' : null,
                'cancelled_by' => $status === 'CANCELLED' ? 'ADMIN' : null,
            ]);

            $orderItem = OrderItem::create([
                'order_id' => $order->id,
                'menu_item_id' => $item->id,
                'item_name' => $item->name,
                'variant_id' => $variant?->id,
                'variant_name' => $variant?->name,
                'quantity' => $qty,
                'unit_price' => $unit,
                'total_price' => $subtotal,
                'instructions' => null,
            ]);

            if ($addon) {
                OrderItemAddon::create([
                    'order_item_id' => $orderItem->id,
                    'addon_id' => $addon->id,
                    'addon_name' => $addon->name,
                    'price' => $addon->price,
                ]);
            }

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'from_status' => null,
                'to_status' => $status,
                'actor_id' => null,
                'actor_type' => 'SYSTEM',
                'comment' => 'Demo order seeded.',
                'created_at' => $placedAt,
            ]);
        }

        $this->command?->info('DemoOrdersSeeder: demo orders ready.');
    }
}
