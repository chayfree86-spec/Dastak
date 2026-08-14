<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Coupons
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->string('discount_type', 20)->default('PERCENTAGE'); // PERCENTAGE, FIXED
            $table->decimal('discount_value', 12, 2);
            $table->decimal('max_discount_amount', 12, 2)->nullable();
            $table->decimal('min_order_value', 12, 2)->default(0.00);
            $table->unsignedInteger('usage_limit_per_user')->default(1);
            $table->unsignedInteger('total_usage_limit')->nullable();
            $table->unsignedInteger('total_used_count')->default(0);
            $table->foreignId('restaurant_id')->nullable()->constrained('restaurants')->nullOnDelete(); // Null = Platform wide
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        // 2. Coupon Usages
        Schema::create('coupon_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coupon_id')->constrained('coupons')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->unsignedBigInteger('order_id')->nullable()->index();
            $table->decimal('discount_amount', 12, 2);
            $table->timestamp('used_at')->useCurrent();
        });

        // 3. Carts
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->foreignId('restaurant_id')->nullable()->constrained('restaurants')->nullOnDelete();
            $table->foreignId('coupon_id')->nullable()->constrained('coupons')->nullOnDelete();
            $table->foreignId('delivery_address_id')->nullable()->constrained('addresses')->nullOnDelete();
            
            // Cached Pricing Breakdown
            $table->decimal('subtotal', 12, 2)->default(0.00);
            $table->decimal('discount_amount', 12, 2)->default(0.00);
            $table->decimal('delivery_fee', 12, 2)->default(0.00);
            $table->decimal('tax_amount', 12, 2)->default(0.00);
            $table->decimal('total_amount', 12, 2)->default(0.00);
            
            $table->timestamps();
        });

        // 4. Cart Items
        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_id')->constrained('carts')->onDelete('cascade');
            $table->foreignId('menu_item_id')->constrained('menu_items')->onDelete('cascade');
            $table->foreignId('variant_id')->nullable()->constrained('menu_item_variants')->nullOnDelete();
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('total_price', 12, 2);
            $table->string('instructions')->nullable();
            $table->timestamps();
        });

        // 5. Cart Item Addons
        Schema::create('cart_item_addons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_item_id')->constrained('cart_items')->onDelete('cascade');
            $table->foreignId('addon_id')->constrained('menu_item_addons')->onDelete('cascade');
            $table->decimal('price', 12, 2)->default(0.00);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_item_addons');
        Schema::dropIfExists('cart_items');
        Schema::dropIfExists('carts');
        Schema::dropIfExists('coupon_usages');
        Schema::dropIfExists('coupons');
    }
};
