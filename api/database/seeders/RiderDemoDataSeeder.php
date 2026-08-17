<?php

namespace Database\Seeders;

use App\Enums\CodStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentMode;
use App\Enums\PaymentStatus;
use App\Models\CodCollection;
use App\Models\DeliveryBoyProfile;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RiderDemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $rider = User::where('mobile', '9777700001')->first() ?? User::find(7);
        if (! $rider) {
            return;
        }

        $restaurant1 = Restaurant::where('name', 'like', '%Biryani%')->first() ?? Restaurant::first();
        $restaurant2 = Restaurant::where('name', 'like', '%Chay%')->orWhere('name', 'like', '%Chaat%')->first() ?? Restaurant::find(2) ?? $restaurant1;

        $customers = User::whereHas('roles', fn ($q) => $q->where('slug', 'customer'))->get();
        if ($customers->isEmpty()) {
            $customers = collect([$rider]);
        }

        // Clean up previous test orders
        Order::where('order_number', 'like', 'DSTK2608%')->orWhere('delivery_boy_id', $rider->id)->forceDelete();
        CodCollection::where('delivery_boy_id', $rider->id)->delete();

        // -------------------------------------------------------------
        // 1. ACTIVE ORDER: Out for Delivery (COD Trip)
        // -------------------------------------------------------------
        $activeOrder = Order::create([
            'order_number' => 'DSTK260817001',
            'customer_id' => $customers->first()?->id ?? $rider->id,
            'restaurant_id' => $restaurant1->id,
            'delivery_boy_id' => $rider->id,
            'status' => OrderStatus::OUT_FOR_DELIVERY,
            'payment_status' => PaymentStatus::PENDING,
            'payment_mode' => PaymentMode::COD,
            'subtotal' => 480.00,
            'discount_amount' => 0.00,
            'delivery_fee' => 40.00,
            'tax_amount' => 24.00,
            'total_amount' => 544.00,
            'commission_rate' => 15.00,
            'commission_amount' => 72.00,
            'restaurant_payout_amount' => 408.00,
            'delivery_address_json' => [
                'customer_name' => 'Priya Sharma',
                'customer_phone' => '9876501234',
                'address' => 'Flat 402, Royal Palms Apartment, Civil Lines, Kanpur',
                'latitude' => 26.4560000,
                'longitude' => 80.3390000,
                'landmark' => 'Near Phool Bagh Crossing',
            ],
            'special_instructions' => 'Please ring the doorbell and keep package upright.',
            'delivery_otp' => '4821',
            'estimated_delivery_minutes' => 25,
            'placed_at' => now()->subMinutes(35),
            'confirmed_at' => now()->subMinutes(30),
            'preparing_at' => now()->subMinutes(25),
            'ready_at' => now()->subMinutes(15),
            'dispatched_at' => now()->subMinutes(10),
        ]);

        OrderItem::create([
            'order_id' => $activeOrder->id,
            'menu_item_id' => 1,
            'item_name' => 'Hyderabadi Chicken Dum Biryani (Full)',
            'unit_price' => 400.00,
            'quantity' => 1,
            'total_price' => 400.00,
        ]);

        OrderItem::create([
            'order_id' => $activeOrder->id,
            'menu_item_id' => 2,
            'item_name' => 'Special Burani Raita',
            'unit_price' => 40.00,
            'quantity' => 2,
            'total_price' => 80.00,
        ]);

        OrderStatusHistory::create([
            'order_id' => $activeOrder->id,
            'from_status' => OrderStatus::READY_FOR_PICKUP->value,
            'to_status' => OrderStatus::OUT_FOR_DELIVERY->value,
            'actor_id' => $rider->id,
            'actor_type' => \App\Enums\ActorType::DELIVERY_BOY,
            'comment' => 'Rider picked up order from kitchen and is heading to customer address.',
            'created_at' => now()->subMinutes(10),
        ]);

        // -------------------------------------------------------------
        // 2. COMPLETED ORDERS TODAY (2 Orders)
        // -------------------------------------------------------------
        $todayOrder1 = Order::create([
            'order_number' => 'DSTK260817002',
            'customer_id' => $customers->first()?->id ?? $rider->id,
            'restaurant_id' => $restaurant2->id,
            'delivery_boy_id' => $rider->id,
            'status' => OrderStatus::DELIVERED,
            'payment_status' => PaymentStatus::PAID,
            'payment_mode' => PaymentMode::COD,
            'subtotal' => 320.00,
            'discount_amount' => 30.00,
            'delivery_fee' => 35.00,
            'tax_amount' => 16.00,
            'total_amount' => 341.00,
            'commission_rate' => 15.00,
            'commission_amount' => 48.00,
            'restaurant_payout_amount' => 272.00,
            'delivery_address_json' => [
                'customer_name' => 'Vikram Singhania',
                'customer_phone' => '9899011223',
                'address' => 'House 14, Mall Road, Cantonment, Kanpur',
                'latitude' => 26.4600000,
                'longitude' => 80.3450000,
            ],
            'delivery_otp' => '1190',
            'placed_at' => now()->subHours(4),
            'confirmed_at' => now()->subHours(4)->addMinutes(5),
            'preparing_at' => now()->subHours(4)->addMinutes(10),
            'ready_at' => now()->subHours(4)->addMinutes(20),
            'dispatched_at' => now()->subHours(4)->addMinutes(25),
            'delivered_at' => now()->subHours(3)->addMinutes(10),
        ]);

        OrderItem::create([
            'order_id' => $todayOrder1->id,
            'menu_item_id' => 3,
            'item_name' => 'Desi Ghee Jalebi (500g)',
            'unit_price' => 240.00,
            'quantity' => 1,
            'total_price' => 240.00,
        ]);
        OrderItem::create([
            'order_id' => $todayOrder1->id,
            'menu_item_id' => 4,
            'item_name' => 'Special Matar Chaat',
            'unit_price' => 80.00,
            'quantity' => 1,
            'total_price' => 80.00,
        ]);

        // Record COD Cash in Hand for Today's Delivered Order
        CodCollection::create([
            'order_id' => $todayOrder1->id,
            'delivery_boy_id' => $rider->id,
            'amount' => 341.00,
            'status' => CodStatus::COLLECTED,
            'created_at' => now()->subHours(3)->addMinutes(10),
        ]);

        $todayOrder2 = Order::create([
            'order_number' => 'DSTK260817003',
            'customer_id' => $customers->first()?->id ?? $rider->id,
            'restaurant_id' => $restaurant1->id,
            'delivery_boy_id' => $rider->id,
            'status' => OrderStatus::DELIVERED,
            'payment_status' => PaymentStatus::PAID,
            'payment_mode' => PaymentMode::ONLINE,
            'subtotal' => 560.00,
            'discount_amount' => 50.00,
            'delivery_fee' => 45.00,
            'tax_amount' => 28.00,
            'total_amount' => 583.00,
            'commission_rate' => 15.00,
            'commission_amount' => 84.00,
            'restaurant_payout_amount' => 476.00,
            'delivery_address_json' => [
                'customer_name' => 'Ananya Gupta',
                'customer_phone' => '9798990011',
                'address' => 'Plot 88, Swaroop Nagar, Kanpur',
                'latitude' => 26.4750000,
                'longitude' => 80.3200000,
            ],
            'delivery_otp' => '9045',
            'placed_at' => now()->subHours(6),
            'delivered_at' => now()->subHours(5)->addMinutes(20),
        ]);

        OrderItem::create([
            'order_id' => $todayOrder2->id,
            'menu_item_id' => 1,
            'item_name' => 'Hyderabadi Chicken Dum Biryani (Full)',
            'unit_price' => 480.00,
            'quantity' => 1,
            'total_price' => 480.00,
        ]);
        OrderItem::create([
            'order_id' => $todayOrder2->id,
            'menu_item_id' => 2,
            'item_name' => 'Extra Salan Gravy',
            'unit_price' => 80.00,
            'quantity' => 1,
            'total_price' => 80.00,
        ]);

        // -------------------------------------------------------------
        // 3. COMPLETED ORDERS YESTERDAY & THIS WEEK (5 Orders)
        // -------------------------------------------------------------
        $yesterdayOrdersData = [
            [
                'number' => 'DSTK260816001',
                'subtotal' => 650.00,
                'fee' => 50.00,
                'total' => 735.00,
                'mode' => PaymentMode::COD,
                'cust' => 'Arun Pandey',
                'addr' => 'Sector 3, Awas Vikas, Kalyanpur, Kanpur',
                'time' => now()->subDays(1)->setTime(13, 30),
                'items' => [
                    ['name' => 'Chicken Biryani Handi Combo', 'price' => 650.00, 'qty' => 1],
                ],
                'cod_status' => CodStatus::COLLECTED,
            ],
            [
                'number' => 'DSTK260816002',
                'subtotal' => 420.00,
                'fee' => 40.00,
                'total' => 481.00,
                'mode' => PaymentMode::ONLINE,
                'cust' => 'Meera Dixit',
                'addr' => 'Flat 12B, Green Park Towers, Civil Lines, Kanpur',
                'time' => now()->subDays(1)->setTime(19, 45),
                'items' => [
                    ['name' => 'Special Matar Chaat & Batashe (3 Servings)', 'price' => 240.00, 'qty' => 1],
                    ['name' => 'Desi Ghee Jalebi (300g)', 'price' => 180.00, 'qty' => 1],
                ],
                'cod_status' => null,
            ],
            [
                'number' => 'DSTK260815001',
                'subtotal' => 890.00,
                'fee' => 60.00,
                'total' => 995.00,
                'mode' => PaymentMode::COD,
                'cust' => 'Dr. R. K. Saxena',
                'addr' => 'Lane 4, Lajpat Nagar, Kanpur',
                'time' => now()->subDays(2)->setTime(20, 15),
                'items' => [
                    ['name' => 'Family Mutton Dum Biryani Pack', 'price' => 890.00, 'qty' => 1],
                ],
                'cod_status' => CodStatus::DEPOSITED_TO_OFFICE,
            ],
            [
                'number' => 'DSTK260814001',
                'subtotal' => 380.00,
                'fee' => 35.00,
                'total' => 434.00,
                'mode' => PaymentMode::ONLINE,
                'cust' => 'Shubham Tiwari',
                'addr' => 'Govind Nagar, Block C, Kanpur',
                'time' => now()->subDays(3)->setTime(14, 10),
                'items' => [
                    ['name' => 'Paneer Butter Masala & Butter Naan (2)', 'price' => 380.00, 'qty' => 1],
                ],
                'cod_status' => null,
            ],
        ];

        foreach ($yesterdayOrdersData as $data) {
            $pastOrder = Order::create([
                'order_number' => $data['number'],
                'customer_id' => $customers->first()?->id ?? $rider->id,
                'restaurant_id' => $restaurant1->id,
                'delivery_boy_id' => $rider->id,
                'status' => OrderStatus::DELIVERED,
                'payment_status' => PaymentStatus::PAID,
                'payment_mode' => $data['mode'],
                'subtotal' => $data['subtotal'],
                'discount_amount' => 0.00,
                'delivery_fee' => $data['fee'],
                'tax_amount' => round($data['subtotal'] * 0.05, 2),
                'total_amount' => $data['total'],
                'commission_rate' => 15.00,
                'commission_amount' => round($data['subtotal'] * 0.15, 2),
                'restaurant_payout_amount' => round($data['subtotal'] * 0.85, 2),
                'delivery_address_json' => [
                    'customer_name' => $data['cust'],
                    'customer_phone' => '9876540000',
                    'address' => $data['addr'],
                ],
                'delivery_otp' => '5541',
                'placed_at' => $data['time']->copy()->subMinutes(35),
                'delivered_at' => $data['time'],
            ]);

            foreach ($data['items'] as $it) {
                OrderItem::create([
                    'order_id' => $pastOrder->id,
                    'menu_item_id' => 1,
                    'item_name' => $it['name'],
                    'unit_price' => $it['price'],
                    'quantity' => $it['qty'],
                    'total_price' => $it['price'] * $it['qty'],
                ]);
            }

            if ($data['cod_status'] !== null) {
                CodCollection::create([
                    'order_id' => $pastOrder->id,
                    'delivery_boy_id' => $rider->id,
                    'amount' => $data['total'],
                    'status' => $data['cod_status'],
                    'created_at' => $data['time'],
                    'deposited_at' => $data['cod_status'] === CodStatus::DEPOSITED_TO_OFFICE ? $data['time']->copy()->addHours(2) : null,
                ]);
            }
        }

        // -------------------------------------------------------------
        // 4. UPDATE DELIVERY BOY PROFILE STATS
        // -------------------------------------------------------------
        $pendingCashTotal = (float) CodCollection::where('delivery_boy_id', $rider->id)
            ->where('status', CodStatus::COLLECTED)
            ->sum('amount');

        DeliveryBoyProfile::where('user_id', $rider->id)->update([
            'is_online' => true,
            'is_busy' => true,
            'current_latitude' => 26.4520000,
            'current_longitude' => 80.3340000,
            'rating' => 4.95,
            'total_ratings' => 85,
            'total_deliveries' => 48,
            'pending_cod_amount' => $pendingCashTotal,
            'total_earned_amount' => 48 * 55.00,
        ]);
    }
}
