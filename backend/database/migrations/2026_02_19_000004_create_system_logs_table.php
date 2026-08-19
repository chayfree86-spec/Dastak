<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_logs', function (Blueprint $table) {
            $table->id();
            $table->string('level', 20)->default('INFO')->index(); // INFO, SUCCESS, WARNING, ERROR, CRITICAL, SECURITY
            $table->string('category', 30)->default('SYSTEM')->index(); // ORDERS, PAYMENTS, RESTAURANTS, DELIVERY, CUSTOMERS, ADMIN, API, DATABASE, REDIS, QUEUE, NOTIFICATIONS, AUTH, SECURITY, SYSTEM, BACKUP
            $table->string('event', 80)->index();
            $table->text('description');
            $table->string('actor_type', 30)->nullable()->index(); // CUSTOMER, RESTAURANT, DELIVERY_BOY, ADMIN, SYSTEM
            $table->unsignedBigInteger('actor_id')->nullable()->index();
            $table->string('actor_name', 150)->nullable();
            $table->string('reference_type', 50)->nullable()->index(); // Order, Payment, Restaurant, User, etc.
            $table->string('reference_id', 100)->nullable()->index();
            $table->string('request_id', 60)->nullable()->index();
            $table->string('endpoint', 255)->nullable()->index();
            $table->string('http_method', 10)->nullable();
            $table->unsignedSmallInteger('http_status')->nullable()->index();
            $table->unsignedInteger('response_time_ms')->nullable();
            $table->string('error_code', 50)->nullable()->index();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_logs');
    }
};
