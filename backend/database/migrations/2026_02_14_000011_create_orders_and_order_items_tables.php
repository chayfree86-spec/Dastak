<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Orders Table
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 50)->unique();
            $table->foreignId('customer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('restaurant_id')->constrained('restaurants')->onDelete('cascade');
            $table->foreignId('delivery_boy_id')->nullable()->constrained('users')->nullOnDelete();
            
            // Statuses
            $table->string('status', 30)->default('PENDING')->index();
            $table->string('payment_status', 20)->default('PENDING')->index();
            $table->string('payment_mode', 20)->default('COD');

            // Financials (Strict Decimal Precision)
            $table->decimal('subtotal', 12, 2);
            $table->decimal('discount_amount', 12, 2)->default(0.00);
            $table->decimal('delivery_fee', 12, 2)->default(0.00);
            $table->decimal('tax_amount', 12, 2)->default(0.00);
            $table->decimal('total_amount', 12, 2);
            
            // Commission & Settlements
            $table->decimal('commission_rate', 5, 2)->default(15.00);
            $table->decimal('commission_amount', 12, 2)->default(0.00);
            $table->decimal('restaurant_payout_amount', 12, 2)->default(0.00);

            // Snapshot Context
            $table->json('delivery_address_json');
            $table->string('special_instructions')->nullable();
            $table->string('delivery_otp', 6);
            $table->unsignedSmallInteger('estimated_delivery_minutes')->default(35);

            // Timeline Milestones
            $table->timestamp('placed_at')->useCurrent()->index();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('preparing_at')->nullable();
            $table->timestamp('ready_at')->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            // Cancellation
            $table->string('cancellation_reason')->nullable();
            $table->string('cancelled_by', 30)->nullable(); // CUSTOMER, RESTAURANT, ADMIN, SYSTEM

            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Order Items
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('menu_item_id')->constrained('menu_items')->onDelete('cascade');
            $table->string('item_name', 150);
            $table->foreignId('variant_id')->nullable()->constrained('menu_item_variants')->nullOnDelete();
            $table->string('variant_name', 100)->nullable();
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('total_price', 12, 2);
            $table->string('instructions')->nullable();
            $table->timestamps();
        });

        // 3. Order Item Addons
        Schema::create('order_item_addons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained('order_items')->onDelete('cascade');
            $table->foreignId('addon_id')->constrained('menu_item_addons')->onDelete('cascade');
            $table->string('addon_name', 100);
            $table->decimal('price', 12, 2)->default(0.00);
            $table->timestamps();
        });

        // 4. Order Status Histories
        Schema::create('order_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->string('from_status', 30)->nullable();
            $table->string('to_status', 30)->index();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_type', 30)->default('SYSTEM');
            $table->text('comment')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_status_histories');
        Schema::dropIfExists('order_item_addons');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
