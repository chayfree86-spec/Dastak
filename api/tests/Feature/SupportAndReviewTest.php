<?php

namespace Tests\Feature;

use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentMode;
use App\Enums\PaymentStatus;
use App\Enums\TicketCategory;
use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\Role;
use App\Models\SupportTicket;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupportAndReviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_customer_can_submit_review_and_ratings_recalculate_for_both_restaurant_and_rider(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $ownerRole = Role::where('slug', UserRole::RESTAURANT->value)->first();
        $owner->roles()->attach($ownerRole);

        $rider = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $riderRole = Role::where('slug', UserRole::DELIVERY_BOY->value)->first();
        $rider->roles()->attach($riderRole);
        $riderProfile = $rider->deliveryProfile()->create([
            'is_online' => true,
            'rating' => 0.00,
            'total_ratings' => 0,
        ]);

        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Taste of India',
            'phone' => '9876543210',
            'address_line1' => 'Civil Lines',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'rating' => 0.00,
            'total_ratings' => 0,
            'is_open' => true,
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number' => 'DSTK-2026-REV1',
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'delivery_boy_id' => $rider->id,
            'status' => OrderStatus::DELIVERED,
            'payment_status' => PaymentStatus::PAID,
            'payment_mode' => PaymentMode::COD,
            'subtotal' => 300.00,
            'total_amount' => 335.00,
            'delivery_address_json' => ['address_line1' => 'Civil Lines'],
            'delivery_otp' => '1234',
            'placed_at' => now(),
        ]);

        // Submit Review: Food rating 5, Delivery rating 4
        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/v1/customer/reviews', [
            'order_id' => $order->id,
            'food_rating' => 5,
            'delivery_rating' => 4,
            'comment' => 'Delicious food and on-time polite rider!',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.food_rating', 5)
            ->assertJsonPath('data.delivery_rating', 4);

        // Assert Restaurant Rating Recalculated
        $this->assertEquals(5.00, (float) $restaurant->fresh()->rating);
        $this->assertEquals(1, $restaurant->fresh()->total_ratings);

        // Assert Rider Rating Recalculated
        $this->assertEquals(4.00, (float) $riderProfile->fresh()->rating);
        $this->assertEquals(1, $riderProfile->fresh()->total_ratings);

        // Rider can view their reviews feed
        $riderReviewResponse = $this->actingAs($rider, 'sanctum')->getJson('/api/v1/delivery/reviews');
        $riderReviewResponse->assertStatus(200)
            ->assertJsonPath('data.0.delivery_rating', 4)
            ->assertJsonPath('meta.average_rating', 4);
    }

    public function test_partner_can_reply_to_customer_review(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $owner = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $ownerRole = Role::where('slug', UserRole::RESTAURANT->value)->first();
        $owner->roles()->attach($ownerRole);

        $restaurant = Restaurant::create([
            'owner_id' => $owner->id,
            'name' => 'Biryani King',
            'phone' => '9876543210',
            'address_line1' => 'Mall Road',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
            'is_open' => true,
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number' => 'DSTK-2026-REV2',
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'status' => OrderStatus::DELIVERED,
            'payment_status' => PaymentStatus::PAID,
            'payment_mode' => PaymentMode::COD,
            'subtotal' => 250.00,
            'total_amount' => 285.00,
            'delivery_address_json' => ['address_line1' => 'Mall Road'],
            'delivery_otp' => '1234',
            'placed_at' => now(),
        ]);

        $review = Review::create([
            'order_id' => $order->id,
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'food_rating' => 5,
            'comment' => 'Best biryani in Kanpur!',
        ]);

        $replyResponse = $this->actingAs($owner, 'sanctum')->postJson("/api/v1/partner/reviews/{$review->id}/reply", [
            'reply' => 'Thank you for your love! We look forward to serving you again.',
        ]);

        $replyResponse->assertStatus(200)
            ->assertJsonPath('data.restaurant_reply', 'Thank you for your love! We look forward to serving you again.');
    }

    public function test_support_ticket_lifecycle_and_threaded_messaging(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $agent = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $agentRole = Role::where('slug', UserRole::SUPPORT_ADMIN->value)->first();
        $agent->roles()->attach($agentRole);

        // 1. Customer opens support ticket
        $ticketResponse = $this->actingAs($customer, 'sanctum')->postJson('/api/v1/customer/tickets', [
            'subject' => 'Late delivery inquiry',
            'category' => TicketCategory::DELIVERY_DELAY->value,
            'priority' => TicketPriority::HIGH->value,
            'message' => 'My order is 20 minutes delayed, please check.',
        ]);

        $ticketResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', TicketStatus::OPEN->value);

        $ticketNumber = $ticketResponse->json('data.ticket_number');
        $ticketId = $ticketResponse->json('data.id');

        // 2. Support Agent claims ticket & updates status to IN_PROGRESS
        $assignResponse = $this->actingAs($agent, 'sanctum')->patchJson("/api/v1/admin/support/tickets/{$ticketId}/assign", [
            'agent_id' => $agent->id,
        ]);
        $assignResponse->assertStatus(200)
            ->assertJsonPath('data.status', TicketStatus::IN_PROGRESS->value);

        // 3. Support Agent replies
        $agentReplyResponse = $this->actingAs($agent, 'sanctum')->postJson("/api/v1/admin/support/tickets/{$ticketId}/messages", [
            'message' => 'We contacted the rider. He is 2 minutes away from your location.',
        ]);
        $agentReplyResponse->assertStatus(201);

        // 4. Support Agent marks ticket RESOLVED
        $resolveResponse = $this->actingAs($agent, 'sanctum')->patchJson("/api/v1/admin/support/tickets/{$ticketId}/status", [
            'status' => TicketStatus::RESOLVED->value,
        ]);
        $resolveResponse->assertStatus(200)
            ->assertJsonPath('data.status', TicketStatus::RESOLVED->value);
    }
}
