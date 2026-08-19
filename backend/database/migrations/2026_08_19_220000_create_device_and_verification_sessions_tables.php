<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. App Verification Sessions Table (Pending / Flow Sessions)
        Schema::create('app_verification_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_public_id', 64)->unique();
            $table->enum('app_type', ['customer', 'delivery_boy', 'restaurant_partner'])->default('customer');
            $table->string('mobile_number', 15);
            $table->string('device_identifier_hash', 64);
            $table->string('otp_hash', 128);
            $table->string('otp_plain', 10)->nullable(); // Generated OTP returned in active verification flow
            $table->enum('status', ['PENDING', 'VERIFIED', 'REVOKED', 'LOCKED'])->default('PENDING');
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['mobile_number', 'app_type', 'status'], 'idx_verif_mobile_app_status');
            $table->index(['device_identifier_hash', 'status'], 'idx_verif_device_status');
        });

        // 2. App Device Sessions Table (Permanent Device-Bound Active Sessions)
        Schema::create('app_device_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('app_type', ['customer', 'delivery_boy', 'restaurant_partner'])->default('customer');
            $table->string('mobile_number', 15);
            $table->string('session_token_hash', 64)->unique();
            $table->string('device_identifier_hash', 64);
            $table->string('device_name', 150)->nullable();
            $table->enum('status', ['ACTIVE', 'REVOKED'])->default('ACTIVE');
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->string('revocation_reason', 100)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status'], 'idx_dev_user_status');
            $table->index(['mobile_number', 'app_type', 'status'], 'idx_dev_mobile_app_status');
            $table->index(['device_identifier_hash', 'status'], 'idx_dev_device_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('app_device_sessions');
        Schema::dropIfExists('app_verification_sessions');
    }
};
