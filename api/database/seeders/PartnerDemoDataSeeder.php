<?php

namespace Database\Seeders;

use App\Enums\OrderStatus;
use App\Enums\PaymentMode;
use App\Enums\PaymentStatus;
use App\Models\MenuCategory;
use App\Models\DeliveryBoy;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Restaurant;
use App\Models\RestaurantBankAccount;
use App\Models\RestaurantOperatingHour;
use App\Models\RestaurantSettlement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PartnerDemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $restaurant = Restaurant::find(2) ?? Restaurant::where('name', 'like', '%Chay Chaupal%')->first();
        if (!$restaurant) {
            $this->command->error('Restaurant Chay Chaupal not found.');
            return;
        }

        // 1. Ensure verified Bank Account for Chay Chaupal
        RestaurantBankAccount::updateOrCreate(
            ['restaurant_id' => $restaurant->id],
            [
                'account_holder_name' => 'Chay Chaupal Operations',
                'bank_name' => 'State Bank of India',
                'account_number' => '389201948201',
                'ifsc_code' => 'SBIN0001234',
                'upi_id' => '9628717175@upi',
            ]
        );

        // 2. Ensure Categories
        $catBeverages = MenuCategory::firstOrCreate(
            ['restaurant_id' => $restaurant->id, 'name' => 'Hot Beverages & Chai'],
            ['slug' => 'hot-beverages-chai', 'is_active' => true]
        );
        $catSnacks = MenuCategory::firstOrCreate(
            ['restaurant_id' => $restaurant->id, 'name' => 'Quick Bites & Snacks'],
            ['slug' => 'quick-bites-snacks', 'is_active' => true]
        );
        $catSandwiches = MenuCategory::firstOrCreate(
            ['restaurant_id' => $restaurant->id, 'name' => 'Sandwiches & Maggi'],
            ['slug' => 'sandwiches-maggi', 'is_active' => true]
        );

        // 3. Ensure Menu Items
        $itemsData = [
            [
                'name' => 'Special Kulhad Chai',
                'short_code' => 'KC01',
                'category_id' => $catBeverages->id,
                'price' => 25.00,
                'discount_price' => 20.00,
                'is_veg' => true,
                'is_available' => true,
                'prep_time' => 8,
                'description' => 'Authentic clay cup brewed tea with ginger and cardamom.',
            ],
            [
                'name' => 'Adrak Elaichi Tea (Full)',
                'short_code' => 'AT02',
                'category_id' => $catBeverages->id,
                'price' => 30.00,
                'discount_price' => null,
                'is_veg' => true,
                'is_available' => true,
                'prep_time' => 8,
                'description' => 'Fresh crushed ginger with green cardamom aroma.',
            ],
            [
                'name' => 'Bun Makkhan (Amul Butter)',
                'short_code' => 'BM01',
                'category_id' => $catSnacks->id,
                'price' => 45.00,
                'discount_price' => 40.00,
                'is_veg' => true,
                'is_available' => true,
                'prep_time' => 5,
                'description' => 'Soft warm bakery bun loaded with fresh yellow Amul butter.',
            ],
            [
                'name' => 'Veg Grilled Cheese Sandwich',
                'short_code' => 'CS01',
                'category_id' => $catSandwiches->id,
                'price' => 90.00,
                'discount_price' => 80.00,
                'is_veg' => true,
                'is_available' => true,
                'prep_time' => 12,
                'description' => 'Triple layer grilled bread stuffed with veggies and melted mozzarella.',
            ],
            [
                'name' => 'Cheese Tadka Masala Maggi',
                'short_code' => 'MM01',
                'category_id' => $catSandwiches->id,
                'price' => 70.00,
                'discount_price' => 65.00,
                'is_veg' => true,
                'is_available' => true,
                'prep_time' => 10,
                'description' => 'Spicy butter tadka maggi topped with processed cheese.',
            ],
            [
                'name' => 'Crispy Aloo Pyaz Pakoda (Plate)',
                'short_code' => 'PK01',
                'category_id' => $catSnacks->id,
                'price' => 60.00,
                'discount_price' => 55.00,
                'is_veg' => true,
                'is_available' => true,
                'prep_time' => 12,
                'description' => 'Deep fried crispy fritters served with green mint chutney.',
            ],
        ];

        $createdMenuItems = [];
        foreach ($itemsData as $it) {
            $createdMenuItems[] = MenuItem::updateOrCreate(
                ['restaurant_id' => $restaurant->id, 'name' => $it['name']],
                [
                    'category_id' => $it['category_id'],
                    'short_code' => $it['short_code'],
                    'base_price' => $it['price'],
                    'discount_price' => $it['discount_price'],
                    'food_type' => \App\Enums\FoodType::VEG,
                    'is_available' => $it['is_available'],
                    'preparation_time_minutes' => $it['prep_time'],
                    'description' => $it['description'],
                ]
            );
        }

        // 4. Create Customers
        $customers = [
            ['name' => 'Rahul Verma', 'mobile' => '9839011223', 'address' => 'Flat 302, Royal Residency, Civil Lines, Kanpur'],
            ['name' => 'Pooja Sharma', 'mobile' => '9839044556', 'address' => 'House 14/B, Swaroop Nagar, Kanpur'],
            ['name' => 'Amitabh Saxena', 'mobile' => '9839077889', 'address' => 'Plot 55, Kakadeo, Coaching Hub, Kanpur'],
            ['name' => 'Sneha Gupta', 'mobile' => '9839099001', 'address' => 'B-44, Naveen Market, Kanpur'],
            ['name' => 'Vikram Patel', 'mobile' => '9839033445', 'address' => 'Tower 4, Emerald Garden, Kanpur'],
        ];

        $customerUsers = [];
        foreach ($customers as $c) {
            $u = User::firstOrCreate(
                ['mobile' => $c['mobile']],
                [
                    'name' => $c['name'],
                    'email' => strtolower(str_replace(' ', '', $c['name'])) . '@gmail.com',
                    'password' => bcrypt('password123'),
                    'status' => 'ACTIVE',
                ]
            );
            $customerUsers[] = ['user' => $u, 'address' => $c['address']];
        }

        // 5. Create Delivery Boy
        $riderUser = User::firstOrCreate(
            ['mobile' => '9876543210'],
            [
                'name' => 'Ramesh Yadav',
                'email' => 'ramesh.rider@dastak.in',
                'password' => bcrypt('password123'),
                'status' => 'ACTIVE',
            ]
        );
        \App\Models\DeliveryBoyProfile::updateOrCreate(
            ['user_id' => $riderUser->id],
            [
                'vehicle_type' => \App\Enums\VehicleType::MOTORCYCLE,
                'vehicle_number' => 'UP-78-AB-1234',
                'is_online' => true,
                'is_busy' => false,
                'rating' => 4.85,
            ]
        );
        $deliveryBoyId = $riderUser->id;

        // 6. Delete old mock orders for this restaurant to ensure squeaky clean state
        Order::where('restaurant_id', $restaurant->id)->forceDelete();

        // 7. SEED ORDER 1: Live PENDING (New Order) #ORD-78101
        $cust1 = $customerUsers[0];
        $order1 = Order::create([
            'order_number' => 'ORD-' . strtoupper(Str::random(6)),
            'customer_id' => $cust1['user']->id,
            'restaurant_id' => $restaurant->id,
            'status' => OrderStatus::PENDING,
            'payment_status' => PaymentStatus::PAID,
            'payment_mode' => PaymentMode::ONLINE,
            'subtotal' => 165.00,
            'discount_amount' => 15.00,
            'delivery_fee' => 30.00,
            'tax_amount' => 8.25,
            'total_amount' => 188.25,
            'commission_rate' => 15.00,
            'commission_amount' => 22.50,
            'restaurant_payout_amount' => 127.50,
            'delivery_otp' => '4521',
            'special_instructions' => 'Please make the chai less sweet with extra ginger.',
            'delivery_address_json' => [
                'address' => $cust1['address'],
                'city' => 'Kanpur',
                'pincode' => '208001',
                'customer_name' => $cust1['user']->name,
                'customer_phone' => $cust1['user']->mobile,
            ],
            'estimated_delivery_minutes' => 25,
            'placed_at' => Carbon::now()->subMinutes(2),
        ]);
        OrderItem::create([
            'order_id' => $order1->id,
            'menu_item_id' => $createdMenuItems[0]->id,
            'item_name' => 'Special Kulhad Chai',
            'quantity' => 3,
            'unit_price' => 20.00,
            'total_price' => 60.00,
            'instructions' => 'Less sugar please',
        ]);
        OrderItem::create([
            'order_id' => $order1->id,
            'menu_item_id' => $createdMenuItems[4]->id,
            'item_name' => 'Cheese Tadka Masala Maggi',
            'quantity' => 1,
            'unit_price' => 65.00,
            'total_price' => 65.00,
        ]);
        OrderItem::create([
            'order_id' => $order1->id,
            'menu_item_id' => $createdMenuItems[2]->id,
            'item_name' => 'Bun Makkhan (Amul Butter)',
            'quantity' => 1,
            'unit_price' => 40.00,
            'total_price' => 40.00,
        ]);

        // 8. SEED ORDER 2: Live PENDING (New Order) #ORD-78102
        $cust2 = $customerUsers[1];
        $order2 = Order::create([
            'order_number' => 'ORD-' . strtoupper(Str::random(6)),
            'customer_id' => $cust2['user']->id,
            'restaurant_id' => $restaurant->id,
            'status' => OrderStatus::PENDING,
            'payment_status' => PaymentStatus::PENDING,
            'payment_mode' => PaymentMode::COD,
            'subtotal' => 215.00,
            'discount_amount' => 0.00,
            'delivery_fee' => 25.00,
            'tax_amount' => 10.75,
            'total_amount' => 250.75,
            'commission_rate' => 15.00,
            'commission_amount' => 32.25,
            'restaurant_payout_amount' => 182.75,
            'delivery_otp' => '5819',
            'special_instructions' => 'Keep bread very crispy grilled.',
            'delivery_address_json' => [
                'address' => $cust2['address'],
                'city' => 'Kanpur',
                'pincode' => '208002',
                'customer_name' => $cust2['user']->name,
                'customer_phone' => $cust2['user']->mobile,
            ],
            'estimated_delivery_minutes' => 30,
            'placed_at' => Carbon::now()->subMinutes(5),
        ]);
        OrderItem::create([
            'order_id' => $order2->id,
            'menu_item_id' => $createdMenuItems[3]->id,
            'item_name' => 'Veg Grilled Cheese Sandwich',
            'quantity' => 2,
            'unit_price' => 80.00,
            'total_price' => 160.00,
        ]);
        OrderItem::create([
            'order_id' => $order2->id,
            'menu_item_id' => $createdMenuItems[5]->id,
            'item_name' => 'Crispy Aloo Pyaz Pakoda (Plate)',
            'quantity' => 1,
            'unit_price' => 55.00,
            'total_price' => 55.00,
        ]);

        // 9. SEED ORDER 3: PREPARING #ORD-78103
        $cust3 = $customerUsers[2];
        $order3 = Order::create([
            'order_number' => 'ORD-' . strtoupper(Str::random(6)),
            'customer_id' => $cust3['user']->id,
            'restaurant_id' => $restaurant->id,
            'delivery_boy_id' => $deliveryBoyId,
            'status' => OrderStatus::PREPARING,
            'payment_status' => PaymentStatus::PAID,
            'payment_mode' => PaymentMode::ONLINE,
            'subtotal' => 140.00,
            'discount_amount' => 0.00,
            'delivery_fee' => 30.00,
            'tax_amount' => 7.00,
            'total_amount' => 177.00,
            'commission_rate' => 15.00,
            'commission_amount' => 21.00,
            'restaurant_payout_amount' => 119.00,
            'delivery_otp' => '9482',
            'delivery_address_json' => [
                'address' => $cust3['address'],
                'city' => 'Kanpur',
                'customer_name' => $cust3['user']->name,
                'customer_phone' => $cust3['user']->mobile,
            ],
            'placed_at' => Carbon::now()->subMinutes(14),
            'confirmed_at' => Carbon::now()->subMinutes(12),
            'preparing_at' => Carbon::now()->subMinutes(10),
        ]);
        OrderItem::create([
            'order_id' => $order3->id,
            'menu_item_id' => $createdMenuItems[1]->id,
            'item_name' => 'Adrak Elaichi Tea (Full)',
            'quantity' => 2,
            'unit_price' => 30.00,
            'total_price' => 60.00,
        ]);
        OrderItem::create([
            'order_id' => $order3->id,
            'menu_item_id' => $createdMenuItems[2]->id,
            'item_name' => 'Bun Makkhan (Amul Butter)',
            'quantity' => 2,
            'unit_price' => 40.00,
            'total_price' => 80.00,
        ]);

        // 10. SEED ORDER 4: READY FOR PICKUP #ORD-78104
        $cust4 = $customerUsers[3];
        $order4 = Order::create([
            'order_number' => 'ORD-' . strtoupper(Str::random(6)),
            'customer_id' => $cust4['user']->id,
            'restaurant_id' => $restaurant->id,
            'delivery_boy_id' => $deliveryBoyId,
            'status' => OrderStatus::READY_FOR_PICKUP,
            'payment_status' => PaymentStatus::PAID,
            'payment_mode' => PaymentMode::ONLINE,
            'subtotal' => 200.00,
            'discount_amount' => 20.00,
            'delivery_fee' => 25.00,
            'tax_amount' => 9.00,
            'total_amount' => 214.00,
            'commission_rate' => 15.00,
            'commission_amount' => 27.00,
            'restaurant_payout_amount' => 153.00,
            'delivery_otp' => '3921',
            'delivery_address_json' => [
                'address' => $cust4['address'],
                'city' => 'Kanpur',
                'customer_name' => $cust4['user']->name,
                'customer_phone' => $cust4['user']->mobile,
            ],
            'placed_at' => Carbon::now()->subMinutes(25),
            'confirmed_at' => Carbon::now()->subMinutes(23),
            'preparing_at' => Carbon::now()->subMinutes(20),
            'ready_at' => Carbon::now()->subMinutes(5),
        ]);
        OrderItem::create([
            'order_id' => $order4->id,
            'menu_item_id' => $createdMenuItems[3]->id,
            'item_name' => 'Veg Grilled Cheese Sandwich',
            'quantity' => 1,
            'unit_price' => 80.00,
            'total_price' => 80.00,
        ]);
        OrderItem::create([
            'order_id' => $order4->id,
            'menu_item_id' => $createdMenuItems[0]->id,
            'item_name' => 'Special Kulhad Chai',
            'quantity' => 2,
            'unit_price' => 20.00,
            'total_price' => 40.00,
        ]);
        OrderItem::create([
            'order_id' => $order4->id,
            'menu_item_id' => $createdMenuItems[4]->id,
            'item_name' => 'Cheese Tadka Masala Maggi',
            'quantity' => 1,
            'unit_price' => 65.00,
            'total_price' => 65.00,
        ]);

        // 11. SEED 15 DELIVERED ORDERS for reports & analytics
        $daysBack = [0, 0, 0, 1, 1, 1, 2, 2, 3, 4, 5, 6, 7, 10, 12];
        foreach ($daysBack as $idx => $days) {
            $cust = $customerUsers[$idx % count($customerUsers)];
            $placedTime = Carbon::now()->subDays($days)->subHours(rand(1, 8));
            $subtotal = rand(150, 480);
            $commission = round($subtotal * 0.15, 2);
            $net = $subtotal - $commission;

            $dOrder = Order::create([
                'order_number' => 'ORD-DEL-' . str_pad($idx + 100, 4, '0', STR_PAD_LEFT),
                'customer_id' => $cust['user']->id,
                'restaurant_id' => $restaurant->id,
                'delivery_boy_id' => $deliveryBoyId,
                'status' => OrderStatus::DELIVERED,
                'payment_status' => PaymentStatus::PAID,
                'payment_mode' => $idx % 2 === 0 ? PaymentMode::ONLINE : PaymentMode::COD,
                'subtotal' => $subtotal,
                'discount_amount' => 0.00,
                'delivery_fee' => 30.00,
                'tax_amount' => round($subtotal * 0.05, 2),
                'total_amount' => $subtotal + 30 + round($subtotal * 0.05, 2),
                'commission_rate' => 15.00,
                'commission_amount' => $commission,
                'restaurant_payout_amount' => $net,
                'delivery_otp' => '7182',
                'delivery_address_json' => [
                    'address' => $cust['address'],
                    'city' => 'Kanpur',
                    'customer_name' => $cust['user']->name,
                    'customer_phone' => $cust['user']->mobile,
                ],
                'placed_at' => $placedTime,
                'confirmed_at' => (clone $placedTime)->addMinutes(2),
                'preparing_at' => (clone $placedTime)->addMinutes(5),
                'ready_at' => (clone $placedTime)->addMinutes(18),
                'dispatched_at' => (clone $placedTime)->addMinutes(20),
                'delivered_at' => (clone $placedTime)->addMinutes(35),
            ]);

            OrderItem::create([
                'order_id' => $dOrder->id,
                'menu_item_id' => $createdMenuItems[0]->id,
                'item_name' => 'Special Kulhad Chai',
                'quantity' => rand(2, 4),
                'unit_price' => 20.00,
                'total_price' => 40.00,
            ]);
            OrderItem::create([
                'order_id' => $dOrder->id,
                'menu_item_id' => $createdMenuItems[rand(1, 5)]->id,
                'item_name' => $createdMenuItems[rand(1, 5)]->name,
                'quantity' => 1,
                'unit_price' => $subtotal - 40,
                'total_price' => $subtotal - 40,
            ]);
        }

        // 12. SEED SETTLEMENTS (restaurant_settlements table)
        RestaurantSettlement::where('restaurant_id', $restaurant->id)->delete();
        $settlementsData = [
            [
                'settlement_number' => 'SETL-2026-08-01',
                'period_start' => Carbon::now()->subDays(23)->toDateString(),
                'period_end' => Carbon::now()->subDays(17)->toDateString(),
                'total_orders_count' => 84,
                'gross_sales' => 16750.00,
                'platform_commission' => 2512.50,
                'tax_deducted' => 0.00,
                'net_payable' => 14237.50,
                'status' => \App\Enums\SettlementStatus::PAID,
                'payout_method' => \App\Enums\PayoutMethod::BANK_TRANSFER,
                'payout_reference' => 'SBI-NEFT-9281048201',
                'paid_at' => Carbon::now()->subDays(16),
            ],
            [
                'settlement_number' => 'SETL-2026-08-08',
                'period_start' => Carbon::now()->subDays(16)->toDateString(),
                'period_end' => Carbon::now()->subDays(10)->toDateString(),
                'total_orders_count' => 112,
                'gross_sales' => 22235.00,
                'platform_commission' => 3335.25,
                'tax_deducted' => 0.00,
                'net_payable' => 18899.75,
                'status' => \App\Enums\SettlementStatus::PAID,
                'payout_method' => \App\Enums\PayoutMethod::BANK_TRANSFER,
                'payout_reference' => 'SBI-NEFT-9391084729',
                'paid_at' => Carbon::now()->subDays(9),
            ],
            [
                'settlement_number' => 'SETL-2026-08-15',
                'period_start' => Carbon::now()->subDays(9)->toDateString(),
                'period_end' => Carbon::now()->subDays(3)->toDateString(),
                'total_orders_count' => 135,
                'gross_sales' => 25180.00,
                'platform_commission' => 3777.00,
                'tax_deducted' => 0.00,
                'net_payable' => 21403.00,
                'status' => \App\Enums\SettlementStatus::PAID,
                'payout_method' => \App\Enums\PayoutMethod::BANK_TRANSFER,
                'payout_reference' => 'SBI-NEFT-9481920481',
                'paid_at' => Carbon::now()->subDays(2),
            ],
            [
                'settlement_number' => 'SETL-2026-08-22-EST',
                'period_start' => Carbon::now()->subDays(2)->toDateString(),
                'period_end' => Carbon::now()->addDays(4)->toDateString(),
                'total_orders_count' => 45,
                'gross_sales' => 7940.00,
                'platform_commission' => 1191.00,
                'tax_deducted' => 0.00,
                'net_payable' => 6749.00,
                'status' => \App\Enums\SettlementStatus::PROCESSING,
                'payout_method' => \App\Enums\PayoutMethod::BANK_TRANSFER,
                'payout_reference' => 'PROCESSING-WEEKLY-CYCLE',
                'paid_at' => null,
            ],
        ];

        foreach ($settlementsData as $st) {
            RestaurantSettlement::create([
                'restaurant_id' => $restaurant->id,
                ...$st,
            ]);
        }

        $this->command->info('Partner Demo Data for Chay Chaupal successfully seeded into database!');
    }
}
