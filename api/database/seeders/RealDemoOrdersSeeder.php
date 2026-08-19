<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Restaurant;
use App\Models\User;
use App\Enums\UserRole;
use App\Enums\AccountStatus;
use App\Enums\ActorType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RealDemoOrdersSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Find the Partner Restaurant (Chay Chaupal or owner 9628717175 or first restaurant)
        $owner = User::where('mobile', '9628717175')->first();
        $restaurant = null;
        if ($owner) {
            $restaurant = Restaurant::where('owner_id', $owner->id)->first();
        }
        if (!$restaurant) {
            $restaurant = Restaurant::where('name', 'like', '%Chay Chaupal%')->first()
                ?? Restaurant::first();
        }

        if (!$restaurant) {
            $this->command?->error('No restaurant found in database to attach orders.');
            return;
        }

        // 2. Ensure We Have Customers
        $customersData = [
            ['name' => 'Pooja Sharma', 'mobile' => '9839044556', 'email' => 'pooja.sharma@example.com', 'address' => 'House 14/B, Swaroop Nagar, Kanpur'],
            ['name' => 'Amit Kumar Verma', 'mobile' => '9876123450', 'email' => 'amit.verma@example.com', 'address' => 'Flat 302, Green Park Residency, Kakadeo, Kanpur'],
            ['name' => 'Neha Gupta', 'mobile' => '9918234567', 'email' => 'neha.gupta@example.com', 'address' => 'Plot 88, Kidwai Nagar, Block C, Kanpur'],
            ['name' => 'Rohit Singh', 'mobile' => '9823456789', 'email' => 'rohit.singh@example.com', 'address' => 'House 56, Civil Lines, Near Phool Bagh, Kanpur'],
            ['name' => 'Anjali Mishra', 'mobile' => '9798765432', 'email' => 'anjali.m@example.com', 'address' => 'A-12, Shyam Nagar, Bypass Road, Kanpur'],
        ];

        $customers = [];
        foreach ($customersData as $c) {
            $user = User::firstOrCreate(
                ['mobile' => $c['mobile']],
                [
                    'name' => $c['name'],
                    'email' => $c['email'],
                    'password' => Hash::make('Customer@123'),
                    'status' => AccountStatus::ACTIVE,
                    'mobile_verified_at' => now(),
                ]
            );
            $user->assignRole(UserRole::CUSTOMER);
            $customers[] = ['user' => $user, 'address' => $c['address']];
        }

        // 3. Ensure We Have Delivery Riders
        $ridersData = [
            ['name' => 'Vikas Yadav', 'mobile' => '9876501234', 'email' => 'vikas.rider@dastakdelivery.com'],
            ['name' => 'Rahul Kashyap', 'mobile' => '9876502345', 'email' => 'rahul.rider@dastakdelivery.com'],
            ['name' => 'Deepak Soni', 'mobile' => '9876503456', 'email' => 'deepak.rider@dastakdelivery.com'],
        ];

        $riders = [];
        foreach ($ridersData as $r) {
            $user = User::firstOrCreate(
                ['mobile' => $r['mobile']],
                [
                    'name' => $r['name'],
                    'email' => $r['email'],
                    'password' => Hash::make('Rider@123'),
                    'status' => AccountStatus::ACTIVE,
                    'mobile_verified_at' => now(),
                ]
            );
            $user->assignRole(UserRole::DELIVERY_BOY);
            $riders[] = $user;
        }

        // 4. Menu items from this restaurant
        $menuItems = MenuItem::where('restaurant_id', $restaurant->id)->get();
        if ($menuItems->isEmpty()) {
            $menuItems = [
                MenuItem::create([
                    'restaurant_id' => $restaurant->id,
                    'name' => 'Kulhad Masala Special Chai',
                    'base_price' => 30.00,
                    'is_veg' => true,
                    'is_available' => true,
                ]),
                MenuItem::create([
                    'restaurant_id' => $restaurant->id,
                    'name' => 'Veg Grilled Cheese Sandwich',
                    'base_price' => 120.00,
                    'is_veg' => true,
                    'is_available' => true,
                ]),
                MenuItem::create([
                    'restaurant_id' => $restaurant->id,
                    'name' => 'Crispy Aloo Pyaz Pakoda (Plate)',
                    'base_price' => 55.00,
                    'is_veg' => true,
                    'is_available' => true,
                ]),
                MenuItem::create([
                    'restaurant_id' => $restaurant->id,
                    'name' => 'Paneer Tikka Roll',
                    'base_price' => 140.00,
                    'is_veg' => true,
                    'is_available' => true,
                ]),
            ];
        }

        // 5. Order Blueprints across all filters
        $orderBlueprints = [
            // A. READY FOR PICKUP (Packed on counter, waiting for rider)
            [
                'order_number' => 'ORD-RDY'.strtoupper(Str::random(4)),
                'status' => 'READY_FOR_PICKUP',
                'customer_idx' => 0,
                'rider_idx' => 0,
                'mode' => 'COD',
                'payment_status' => 'PENDING',
                'mins_ago' => 18,
                'prep_mins' => 15,
                'distance_km' => '1.8',
                'special_instructions' => 'Keep chai cups upright in packet.',
                'items' => [
                    ['item_idx' => 0, 'qty' => 3, 'instructions' => 'Extra adrak & elaichi'],
                    ['item_idx' => 2, 'qty' => 1, 'instructions' => 'Extra crispy with green chutney'],
                ],
            ],
            [
                'order_number' => 'ORD-RDY'.strtoupper(Str::random(4)),
                'status' => 'READY_FOR_PICKUP',
                'customer_idx' => 1,
                'rider_idx' => 1,
                'mode' => 'ONLINE',
                'payment_status' => 'PAID',
                'mins_ago' => 25,
                'prep_mins' => 20,
                'distance_km' => '3.2',
                'special_instructions' => 'Please provide extra napkins and spoons.',
                'items' => [
                    ['item_idx' => 1, 'qty' => 2, 'instructions' => 'Medium spicy'],
                ],
            ],

            // B. NEW INCOMING ORDERS (Pending acceptance)
            [
                'order_number' => 'ORD-NEW'.strtoupper(Str::random(4)),
                'status' => 'PENDING',
                'customer_idx' => 2,
                'rider_idx' => null,
                'mode' => 'ONLINE',
                'payment_status' => 'PAID',
                'mins_ago' => 2,
                'prep_mins' => 20,
                'distance_km' => '2.5',
                'special_instructions' => 'Customer requested fast delivery for office meeting.',
                'items' => [
                    ['item_idx' => 0, 'qty' => 4, 'instructions' => 'Less sugar in 2 cups'],
                    ['item_idx' => 1, 'qty' => 2, 'instructions' => 'Crispy grilled with cheese'],
                ],
            ],
            [
                'order_number' => 'ORD-NEW'.strtoupper(Str::random(4)),
                'status' => 'PENDING',
                'customer_idx' => 3,
                'rider_idx' => null,
                'mode' => 'COD',
                'payment_status' => 'PENDING',
                'mins_ago' => 4,
                'prep_mins' => 15,
                'distance_km' => '1.2',
                'special_instructions' => 'Call on mobile when ready.',
                'items' => [
                    ['item_idx' => 2, 'qty' => 2, 'instructions' => 'Extra fried'],
                    ['item_idx' => 0, 'qty' => 2, 'instructions' => 'Strong masala'],
                ],
            ],

            // C. PREPARING (Cooking in Kitchen)
            [
                'order_number' => 'ORD-PRP'.strtoupper(Str::random(4)),
                'status' => 'PREPARING',
                'customer_idx' => 4,
                'rider_idx' => 2,
                'mode' => 'ONLINE',
                'payment_status' => 'PAID',
                'mins_ago' => 10,
                'prep_mins' => 25,
                'distance_km' => '4.1',
                'special_instructions' => 'Please do not add onions.',
                'items' => [
                    ['item_idx' => 1, 'qty' => 1, 'instructions' => 'No onion'],
                    ['item_idx' => 0, 'qty' => 2, 'instructions' => 'Normal'],
                ],
            ],
            [
                'order_number' => 'ORD-PRP'.strtoupper(Str::random(4)),
                'status' => 'PREPARING',
                'customer_idx' => 0,
                'rider_idx' => 0,
                'mode' => 'COD',
                'payment_status' => 'PENDING',
                'mins_ago' => 12,
                'prep_mins' => 20,
                'distance_km' => '2.0',
                'special_instructions' => 'Extra chutney packets.',
                'items' => [
                    ['item_idx' => 2, 'qty' => 3, 'instructions' => 'Hot & fresh'],
                ],
            ],

            // D. OUT FOR DELIVERY (Picked up by Rider, Time & Distance active)
            [
                'order_number' => 'ORD-OUT'.strtoupper(Str::random(4)),
                'status' => 'OUT_FOR_DELIVERY',
                'customer_idx' => 1,
                'rider_idx' => 0,
                'mode' => 'ONLINE',
                'payment_status' => 'PAID',
                'mins_ago' => 30,
                'prep_mins' => 15,
                'distance_km' => '2.4',
                'special_instructions' => 'Leave at door if bell not answered.',
                'items' => [
                    ['item_idx' => 0, 'qty' => 2, 'instructions' => ''],
                    ['item_idx' => 1, 'qty' => 2, 'instructions' => ''],
                ],
            ],
            [
                'order_number' => 'ORD-OUT'.strtoupper(Str::random(4)),
                'status' => 'OUT_FOR_DELIVERY',
                'customer_idx' => 2,
                'rider_idx' => 1,
                'mode' => 'COD',
                'payment_status' => 'PENDING',
                'mins_ago' => 35,
                'prep_mins' => 20,
                'distance_km' => '3.8',
                'special_instructions' => 'Rider has change for 500 note.',
                'items' => [
                    ['item_idx' => 2, 'qty' => 2, 'instructions' => ''],
                    ['item_idx' => 0, 'qty' => 3, 'instructions' => ''],
                ],
            ],

            // E. DELIVERED (Completed Orders)
            [
                'order_number' => 'ORD-DEL'.strtoupper(Str::random(4)),
                'status' => 'DELIVERED',
                'customer_idx' => 3,
                'rider_idx' => 2,
                'mode' => 'ONLINE',
                'payment_status' => 'PAID',
                'mins_ago' => 90,
                'prep_mins' => 15,
                'distance_km' => '2.1',
                'special_instructions' => null,
                'items' => [
                    ['item_idx' => 0, 'qty' => 2, 'instructions' => ''],
                    ['item_idx' => 1, 'qty' => 1, 'instructions' => ''],
                ],
            ],
            [
                'order_number' => 'ORD-DEL'.strtoupper(Str::random(4)),
                'status' => 'DELIVERED',
                'customer_idx' => 4,
                'rider_idx' => 0,
                'mode' => 'COD',
                'payment_status' => 'PAID',
                'mins_ago' => 150,
                'prep_mins' => 20,
                'distance_km' => '1.5',
                'special_instructions' => null,
                'items' => [
                    ['item_idx' => 2, 'qty' => 2, 'instructions' => ''],
                ],
            ],

            // F. CANCELLED ORDER
            [
                'order_number' => 'ORD-CAN'.strtoupper(Str::random(4)),
                'status' => 'CANCELLED',
                'customer_idx' => 0,
                'rider_idx' => null,
                'mode' => 'ONLINE',
                'payment_status' => 'REFUNDED',
                'mins_ago' => 180,
                'prep_mins' => 15,
                'distance_km' => '3.0',
                'special_instructions' => 'Cancelled due to customer change of address.',
                'items' => [
                    ['item_idx' => 1, 'qty' => 2, 'instructions' => ''],
                ],
            ],
        ];

        foreach ($orderBlueprints as $bp) {
            $customerEntry = $customers[$bp['customer_idx']];
            $customerUser = $customerEntry['user'];
            $riderUser = $bp['rider_idx'] !== null ? $riders[$bp['rider_idx']] : null;

            $placedAt = now()->subMinutes($bp['mins_ago']);

            // Calculate Subtotal & Items
            $subtotal = 0.0;
            $itemsData = [];
            foreach ($bp['items'] as $it) {
                $menuItem = $menuItems[$it['item_idx']] ?? $menuItems[0];
                $unitPrice = (float) ($menuItem->discount_price ?? $menuItem->base_price ?? 50.00);
                $qty = (int) $it['qty'];
                $lineTotal = round($unitPrice * $qty, 2);
                $subtotal += $lineTotal;

                $itemsData[] = [
                    'menu_item_id' => $menuItem->id,
                    'item_name' => $menuItem->name,
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'total_price' => $lineTotal,
                    'instructions' => $it['instructions'],
                    'is_veg' => (bool) $menuItem->is_veg,
                ];
            }

            $discount = 0.00;
            $deliveryFee = 25.00;
            $tax = round($subtotal * 0.05, 2);
            $total = $subtotal - $discount + $deliveryFee + $tax;
            $commissionRate = (float) ($restaurant->commission_rate ?? 15.00);
            $commission = round($subtotal * $commissionRate / 100, 2);

            $order = Order::create([
                'order_number' => $bp['order_number'],
                'customer_id' => $customerUser->id,
                'restaurant_id' => $restaurant->id,
                'delivery_boy_id' => $riderUser?->id,
                'status' => $bp['status'],
                'payment_status' => $bp['payment_status'],
                'payment_mode' => $bp['mode'],
                'subtotal' => $subtotal,
                'discount_amount' => $discount,
                'delivery_fee' => $deliveryFee,
                'tax_amount' => $tax,
                'total_amount' => $total,
                'commission_rate' => $commissionRate,
                'commission_amount' => $commission,
                'restaurant_payout_amount' => $subtotal - $commission,
                'delivery_address_json' => [
                    'contact_name' => $customerUser->name,
                    'contact_mobile' => $customerUser->mobile,
                    'address' => $customerEntry['address'],
                    'city' => 'Kanpur',
                    'pincode' => '208001',
                ],
                'special_instructions' => $bp['special_instructions'],
                'delivery_otp' => (string) random_int(1000, 9999),
                'estimated_delivery_minutes' => $bp['prep_mins'],
                'placed_at' => $placedAt,
                'confirmed_at' => in_array($bp['status'], ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED']) ? $placedAt->copy()->addMinutes(2) : null,
                'preparing_at' => in_array($bp['status'], ['PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED']) ? $placedAt->copy()->addMinutes(5) : null,
                'ready_at' => in_array($bp['status'], ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED']) ? $placedAt->copy()->addMinutes($bp['prep_mins']) : null,
                'dispatched_at' => in_array($bp['status'], ['OUT_FOR_DELIVERY', 'DELIVERED']) ? $placedAt->copy()->addMinutes($bp['prep_mins'] + 3) : null,
                'delivered_at' => $bp['status'] === 'DELIVERED' ? $placedAt->copy()->addMinutes($bp['prep_mins'] + 18) : null,
                'cancelled_at' => $bp['status'] === 'CANCELLED' ? $placedAt->copy()->addMinutes(8) : null,
            ]);

            // Create Order Items in DB
            foreach ($itemsData as $it) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $it['menu_item_id'],
                    'item_name' => $it['item_name'],
                    'quantity' => $it['quantity'],
                    'unit_price' => $it['unit_price'],
                    'total_price' => $it['total_price'],
                    'instructions' => $it['instructions'],
                ]);
            }

            // Create Initial Status History
            OrderStatusHistory::create([
                'order_id' => $order->id,
                'from_status' => null,
                'to_status' => $bp['status'],
                'actor_id' => $customerUser->id,
                'actor_type' => ActorType::CUSTOMER,
                'comment' => "Order seeded with status: {$bp['status']}",
                'created_at' => $placedAt,
            ]);
        }

        $this->command?->info("RealDemoOrdersSeeder: Created 11 realistic orders for Restaurant '{$restaurant->name}' across all pipeline statuses.");
    }
}
