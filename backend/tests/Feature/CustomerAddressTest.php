<?php

namespace Tests\Feature;

use App\Enums\AccountStatus;
use App\Enums\AddressType;
use App\Models\Address;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerAddressTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_customer_can_create_address_and_it_becomes_default_if_first(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/v1/customer/addresses', [
            'type' => AddressType::HOME->value,
            'contact_name' => 'Rahul Sharma',
            'contact_mobile' => '9876543210',
            'address_line1' => 'Flat 402, Royal Palms, Civil Lines',
            'landmark' => 'Near City Mall',
            'city' => 'Kanpur',
            'state' => 'Uttar Pradesh',
            'pincode' => '208001',
            'latitude' => 26.4499,
            'longitude' => 80.3319,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_default', true)
            ->assertJsonPath('data.city', 'Kanpur');

        $this->assertDatabaseHas('addresses', [
            'user_id' => $customer->id,
            'contact_name' => 'Rahul Sharma',
            'is_default' => 1,
        ]);
    }

    public function test_customer_adding_second_default_address_unsets_first(): void
    {
        $customer = User::factory()->create(['status' => AccountStatus::ACTIVE]);

        $firstAddress = Address::create([
            'user_id' => $customer->id,
            'type' => AddressType::HOME,
            'contact_name' => 'Rahul Home',
            'contact_mobile' => '9876543210',
            'address_line1' => 'House 1',
            'city' => 'Kanpur',
            'pincode' => '208001',
            'is_default' => true,
        ]);

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/v1/customer/addresses', [
            'type' => AddressType::WORK->value,
            'contact_name' => 'Rahul Work',
            'contact_mobile' => '9876543210',
            'address_line1' => 'Office Tower B',
            'city' => 'Kanpur',
            'pincode' => '208002',
            'is_default' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.is_default', true);

        // First address must now be false
        $this->assertFalse((bool) $firstAddress->fresh()->is_default);
    }

    public function test_customer_cannot_modify_another_customers_address(): void
    {
        $customerA = User::factory()->create(['status' => AccountStatus::ACTIVE]);
        $customerB = User::factory()->create(['status' => AccountStatus::ACTIVE]);

        $addressOfA = Address::create([
            'user_id' => $customerA->id,
            'type' => AddressType::HOME,
            'contact_name' => 'Customer A',
            'contact_mobile' => '9876543210',
            'address_line1' => 'Private Road 1',
            'city' => 'Kanpur',
            'pincode' => '208001',
        ]);

        $response = $this->actingAs($customerB, 'sanctum')->putJson("/api/v1/customer/addresses/{$addressOfA->id}", [
            'contact_name' => 'Hacker Name',
        ]);

        $response->assertStatus(422);
    }
}
