<?php

namespace Tests\Feature;

use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentMode;
use App\Enums\PaymentStatus;
use App\Enums\PayoutMethod;
use App\Enums\SettlementStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnalyticsAndSettlementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_admin_analytics_dashboard_metrics_and_charts(): void
    {
        $admin = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $adminRole = Role::where('slug', UserRole::SUPER_ADMIN->value)->first();
        $admin->roles()->attach($adminRole);

        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $ownerRole = Role::where('slug', UserRole::RESTAURANT->value)->first();
        $owner->roles()->attach($ownerRole);

        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Royal Spice',
            'phone' => '9876543210',
            'address_line1' => 'Civil Lines',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'commission_rate' => 15.00,
            'is_open' => true,
            'is_active' => true,
        ]);

        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);

        // Create 2 Delivered Orders
        Order::create([
            'order_number' => 'DSTK-2026-ANA1',
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'status' => OrderStatus::DELIVERED,
            'payment_status' => PaymentStatus::PAID,
            'payment_mode' => PaymentMode::ONLINE,
            'subtotal' => 500.00,
            'delivery_fee' => 35.00,
            'tax_amount' => 25.00,
            'total_amount' => 560.00,
            'commission_amount' => 75.00,
            'restaurant_payout_amount' => 425.00,
            'delivery_address_json' => ['address_line1' => 'Civil Lines'],
            'delivery_otp' => '1234',
            'placed_at' => now(),
            'delivered_at' => now(),
        ]);

        Order::create([
            'order_number' => 'DSTK-2026-ANA2',
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'status' => OrderStatus::DELIVERED,
            'payment_status' => PaymentStatus::PAID,
            'payment_mode' => PaymentMode::ONLINE,
            'subtotal' => 300.00,
            'delivery_fee' => 35.00,
            'tax_amount' => 15.00,
            'total_amount' => 350.00,
            'commission_amount' => 45.00,
            'restaurant_payout_amount' => 255.00,
            'delivery_address_json' => ['address_line1' => 'Civil Lines'],
            'delivery_otp' => '1234',
            'placed_at' => now(),
            'delivered_at' => now(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/analytics/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.summary.kpis.total_gmv', 910)
            ->assertJsonPath('data.summary.kpis.total_platform_commission', 120)
            ->assertJsonPath('data.summary.kpis.total_delivered_orders', 2);
    }

    public function test_partner_analytics_and_settlement_history(): void
    {
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $ownerRole = Role::where('slug', UserRole::RESTAURANT->value)->first();
        $owner->roles()->attach($ownerRole);

        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Pizza House',
            'phone' => '9876543210',
            'address_line1' => 'Civil Lines',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'commission_rate' => 10.00,
            'is_open' => true,
            'is_active' => true,
        ]);

        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);

        Order::create([
            'order_number' => 'DSTK-2026-PAR1',
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'status' => OrderStatus::DELIVERED,
            'payment_status' => PaymentStatus::PAID,
            'payment_mode' => PaymentMode::ONLINE,
            'subtotal' => 400.00,
            'delivery_fee' => 35.00,
            'tax_amount' => 20.00,
            'total_amount' => 455.00,
            'commission_amount' => 40.00,
            'restaurant_payout_amount' => 360.00,
            'delivery_address_json' => ['address_line1' => 'Civil Lines'],
            'delivery_otp' => '1234',
            'placed_at' => now(),
            'delivered_at' => now(),
        ]);

        $response = $this->actingAs($owner, 'sanctum')->getJson('/api/v1/partner/analytics/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('data.kpis.gross_sales', 400)
            ->assertJsonPath('data.kpis.net_payout', 360)
            ->assertJsonPath('data.kpis.commission_paid', 40);
    }

    public function test_admin_can_generate_settlement_batch_and_process_payout(): void
    {
        $admin = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $adminRole = Role::where('slug', UserRole::SUPER_ADMIN->value)->first();
        $admin->roles()->attach($adminRole);

        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $ownerRole = Role::where('slug', UserRole::RESTAURANT->value)->first();
        $owner->roles()->attach($ownerRole);

        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Curry Hub',
            'phone' => '9876543210',
            'address_line1' => 'Civil Lines',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'commission_rate' => 20.00,
            'is_open' => true,
            'is_active' => true,
        ]);

        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);

        Order::create([
            'order_number' => 'DSTK-2026-SET1',
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'status' => OrderStatus::DELIVERED,
            'payment_status' => PaymentStatus::PAID,
            'payment_mode' => PaymentMode::ONLINE,
            'subtotal' => 600.00,
            'delivery_fee' => 35.00,
            'tax_amount' => 30.00,
            'total_amount' => 665.00,
            'commission_amount' => 120.00,
            'restaurant_payout_amount' => 480.00,
            'delivery_address_json' => ['address_line1' => 'Civil Lines'],
            'delivery_otp' => '1234',
            'placed_at' => now(),
            'delivered_at' => now(),
        ]);

        // 1. Generate Settlement Batch
        $generateResponse = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/settlements/generate', [
            'restaurant_id' => $restaurant->id,
            'period_start' => now()->subDay()->toDateString(),
            'period_end' => now()->toDateString(),
        ]);

        $generateResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.gross_sales', 600)
            ->assertJsonPath('data.platform_commission', 120)
            ->assertJsonPath('data.net_payable', 480)
            ->assertJsonPath('data.status', SettlementStatus::PENDING->value);

        $settlementId = $generateResponse->json('data.id');

        // 2. Process Payout with Bank Transfer Reference
        $payoutResponse = $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/admin/settlements/{$settlementId}/process-payout", [
            'payout_method' => PayoutMethod::BANK_TRANSFER->value,
            'payout_reference' => 'UTR998877665544',
            'notes' => 'Weekly NEFT settlement processed.',
        ]);

        $payoutResponse->assertStatus(200)
            ->assertJsonPath('data.status', SettlementStatus::PAID->value)
            ->assertJsonPath('data.payout_reference', 'UTR998877665544');

        // 3. Partner can view their settlement record
        $partnerSettlementsResponse = $this->actingAs($owner, 'sanctum')->getJson('/api/v1/partner/settlements');
        $partnerSettlementsResponse->assertStatus(200)
            ->assertJsonPath('data.0.net_payable', 480)
            ->assertJsonPath('data.0.status', SettlementStatus::PAID->value);
    }

    public function test_reports_orders_and_sales_csv_exports(): void
    {
        $admin = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $adminRole = Role::where('slug', UserRole::SUPER_ADMIN->value)->first();
        $admin->roles()->attach($adminRole);

        // Orders CSV Export Stream
        $ordersExport = $this->actingAs($admin, 'sanctum')->get('/api/v1/admin/reports/orders/export');
        $ordersExport->assertStatus(200);
        $this->assertStringContainsString('text/csv', $ordersExport->headers->get('content-type'));

        // Sales CSV Export Stream
        $salesExport = $this->actingAs($admin, 'sanctum')->get('/api/v1/admin/reports/sales/export');
        $salesExport->assertStatus(200);
        $this->assertStringContainsString('text/csv', $salesExport->headers->get('content-type'));
    }
}
