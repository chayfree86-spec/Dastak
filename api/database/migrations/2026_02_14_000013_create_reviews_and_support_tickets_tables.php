<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Reviews Table (Food/Restaurant & Rider Reviews)
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained('orders')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('restaurant_id')->constrained('restaurants')->onDelete('cascade');
            $table->foreignId('delivery_boy_id')->nullable()->constrained('users')->nullOnDelete();
            
            // Ratings (1 to 5 Stars)
            $table->unsignedTinyInteger('food_rating');
            $table->unsignedTinyInteger('delivery_rating')->nullable();
            $table->text('comment')->nullable();
            
            // Restaurant Partner Reply
            $table->text('restaurant_reply')->nullable();
            $table->timestamp('restaurant_replied_at')->nullable();

            $table->boolean('is_visible')->default(true)->index();
            $table->timestamps();
        });

        // 2. Support Tickets Table
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number', 50)->unique();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->string('subject', 190);
            $table->string('category', 40)->default('OTHER')->index();
            $table->string('priority', 20)->default('MEDIUM')->index();
            $table->string('status', 20)->default('OPEN')->index();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        // 3. Support Ticket Threaded Messages
        Schema::create('support_ticket_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('support_tickets')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('sender_type', 30)->default('CUSTOMER'); // CUSTOMER, SUPPORT_AGENT, SYSTEM
            $table->text('message');
            $table->string('attachment_url')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_ticket_messages');
        Schema::dropIfExists('support_tickets');
        Schema::dropIfExists('reviews');
    }
};
