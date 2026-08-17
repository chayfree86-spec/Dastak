<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_boy_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('vehicle_type', 30)->default('MOTORCYCLE');
            $table->string('vehicle_number', 30)->nullable();
            $table->string('driving_license_number', 50)->nullable();
            $table->string('aadhar_number', 20)->nullable();
            $table->string('pan_number', 20)->nullable();
            
            // Banking & Payout info
            $table->string('bank_account_name')->nullable();
            $table->string('bank_account_number', 50)->nullable();
            $table->string('bank_ifsc', 20)->nullable();
            $table->string('bank_upi_id', 50)->nullable();

            // Real-time operations & fleet state
            $table->boolean('is_online')->default(false)->index();
            $table->boolean('is_busy')->default(false)->index();
            $table->decimal('current_latitude', 10, 7)->nullable()->index();
            $table->decimal('current_longitude', 10, 7)->nullable()->index();
            $table->timestamp('last_location_updated_at')->nullable();

            // Ratings and Lifetime stats
            $table->decimal('rating', 3, 2)->default(5.00);
            $table->unsignedInteger('total_ratings')->default(0);
            $table->unsignedInteger('total_deliveries')->default(0);
            $table->decimal('pending_cod_amount', 12, 2)->default(0.00);
            $table->decimal('total_earned_amount', 12, 2)->default(0.00);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_boy_profiles');
    }
};
