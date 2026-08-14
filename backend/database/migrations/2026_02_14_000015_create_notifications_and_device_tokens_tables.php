<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Laravel In-App Notifications Table
        if (! Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('type');
                $table->morphs('notifiable');
                $table->text('data');
                $table->timestamp('read_at')->nullable()->index();
                $table->timestamps();
            });
        }

        // 2. User Device Tokens for FCM Push Notifications
        Schema::create('user_device_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('fcm_token', 255)->index();
            $table->string('device_type', 30)->default('ANDROID'); // ANDROID, IOS, WEB_PWA
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'fcm_token']);
        });

        // 3. SMS & WhatsApp Communication Logs
        Schema::create('sms_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('recipient', 50)->index();
            $table->string('channel', 20)->default('SMS'); // SMS, WHATSAPP
            $table->string('template_name', 100)->default('GENERAL');
            $table->text('message_body');
            $table->string('provider', 50)->default('MOCK_GATEWAY');
            $table->string('provider_message_id', 100)->nullable();
            $table->string('status', 20)->default('SENT')->index(); // SENT, DELIVERED, FAILED
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_logs');
        Schema::dropIfExists('user_device_tokens');
        Schema::dropIfExists('notifications');
    }
};
