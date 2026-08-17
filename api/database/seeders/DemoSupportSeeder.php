<?php

namespace Database\Seeders;

use App\Enums\TicketCategory;
use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Order;
use App\Models\SupportTicket;
use App\Models\User;
use App\Services\SupportTicketService;
use Illuminate\Database\Seeder;

class DemoSupportSeeder extends Seeder
{
    public function run(SupportTicketService $service): void
    {
        $customer = User::where('email', 'priya@gmail.com')->first();
        $admin = User::where('email', 'admin@dastakdelivery.com')->first();

        if (! $customer) {
            $this->command?->warn('DemoSupportSeeder: customer missing.');
            return;
        }

        if (SupportTicket::where('user_id', $customer->id)->exists()) {
            $this->command?->info('DemoSupportSeeder: tickets already present, skipping.');
            return;
        }

        $order = Order::where('customer_id', $customer->id)->first();

        // 1. OPEN, order-linked
        $service->createTicket($customer, [
            'order_id' => $order?->id,
            'subject' => 'Item Missing in Delivered Package',
            'category' => TicketCategory::ORDER_ISSUE->value,
            'priority' => TicketPriority::HIGH->value,
            'message' => 'I ordered 2 biryanis but the package only had 1 container.',
        ]);

        // 2. IN_PROGRESS with an agent reply
        $t2 = $service->createTicket($customer, [
            'subject' => 'Delayed Delivery & Cold Food',
            'category' => TicketCategory::DELIVERY_DELAY->value,
            'priority' => TicketPriority::MEDIUM->value,
            'message' => 'The delivery rider arrived 40 minutes late and the food was cold.',
        ]);
        if ($admin) {
            $service->addMessage($t2, $admin, 'We have credited a coupon to compensate for the delay.', null, 'SUPPORT_AGENT');
            $service->updateStatus($t2, TicketStatus::IN_PROGRESS, $admin);
        }

        // 3. RESOLVED
        $t3 = $service->createTicket($customer, [
            'subject' => 'App Location Pinning Issue',
            'category' => TicketCategory::ACCOUNT_ISSUE->value,
            'priority' => TicketPriority::LOW->value,
            'message' => 'The delivery map cannot detect my exact society tower.',
        ]);
        if ($admin) {
            $service->addMessage($t3, $admin, 'Geo-coordinates updated for your building tower.', null, 'SUPPORT_AGENT');
            $service->updateStatus($t3, TicketStatus::RESOLVED, $admin);
        }

        $this->command?->info('DemoSupportSeeder: demo tickets ready.');
    }
}
