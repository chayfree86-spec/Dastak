<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Restaurant Settlements
        Schema::create('restaurant_settlements', function (Blueprint $table) {
            $table->id();
            $table->string('settlement_number', 50)->unique();
            $table->foreignId('restaurant_id')->constrained('restaurants')->onDelete('cascade');
            $table->date('period_start');
            $table->date('period_end');
            $table->unsignedInteger('total_orders_count')->default(0);
            
            // Financial Aggregations
            $table->decimal('gross_sales', 12, 2)->default(0.00);
            $table->decimal('platform_commission', 12, 2)->default(0.00);
            $table->decimal('tax_deducted', 12, 2)->default(0.00);
            $table->decimal('net_payable', 12, 2)->default(0.00);

            $table->string('status', 20)->default('PENDING')->index(); // PENDING, PROCESSING, PAID, FAILED
            $table->string('payout_method', 30)->nullable(); // BANK_TRANSFER, UPI, MANUAL
            $table->string('payout_reference', 100)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();

            $table->timestamps();
        });

        // 2. Settlement Orders Link Table
        Schema::create('settlement_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('settlement_id')->constrained('restaurant_settlements')->onDelete('cascade');
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->decimal('order_amount', 12, 2);
            $table->decimal('commission_amount', 12, 2);
            $table->decimal('payout_amount', 12, 2);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settlement_orders');
        Schema::dropIfExists('restaurant_settlements');
    }
};
