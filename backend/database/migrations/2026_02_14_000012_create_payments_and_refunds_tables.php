<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Payments Table
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('transaction_id', 100)->unique();
            $table->string('gateway', 30)->default('RAZORPAY'); // RAZORPAY, CASH, WALLET
            $table->string('gateway_order_id', 100)->nullable()->index();
            $table->string('gateway_payment_id', 100)->nullable()->index();
            $table->text('gateway_signature')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('INR');
            $table->string('status', 20)->default('PENDING')->index(); // PENDING, SUCCESS, FAILED, REFUNDED
            $table->json('gateway_response_json')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        // 2. Refunds Table
        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments')->onDelete('cascade');
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->string('refund_transaction_id', 100)->unique();
            $table->decimal('amount', 12, 2);
            $table->string('reason');
            $table->string('status', 20)->default('PENDING')->index(); // PENDING, PROCESSED, FAILED
            $table->string('gateway_refund_id', 100)->nullable()->index();
            $table->json('gateway_response_json')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });

        // 3. COD Cash Collections & Reconciliation
        Schema::create('cod_collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained('orders')->onDelete('cascade');
            $table->foreignId('delivery_boy_id')->constrained('users')->onDelete('cascade');
            $table->decimal('amount', 12, 2);
            $table->string('status', 30)->default('COLLECTED')->index(); // COLLECTED, DEPOSITED_TO_OFFICE, VERIFIED
            $table->timestamp('deposited_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cod_collections');
        Schema::dropIfExists('refunds');
        Schema::dropIfExists('payments');
    }
};
