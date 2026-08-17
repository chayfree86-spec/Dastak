<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('zone_id')->nullable()->constrained('zones')->nullOnDelete();
            $table->string('name', 150)->index();
            $table->string('slug', 160)->unique();
            $table->text('description')->nullable();
            $table->string('logo')->nullable();
            $table->string('banner')->nullable();
            $table->string('phone', 20);
            $table->string('email')->nullable();
            
            // Location
            $table->string('address_line1');
            $table->string('address_line2')->nullable();
            $table->string('city', 100)->default('Kanpur')->index();
            $table->string('pincode', 10)->index();
            $table->decimal('latitude', 10, 7)->index();
            $table->decimal('longitude', 10, 7)->index();

            // Financial & Compliance
            $table->decimal('commission_rate', 5, 2)->default(15.00);
            $table->string('fssai_license_number', 50)->nullable();
            $table->string('gst_number', 30)->nullable();

            // Operational Parameters
            $table->boolean('is_pure_veg')->default(false)->index();
            $table->boolean('is_open')->default(true)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedSmallInteger('preparation_time_minutes')->default(25);
            $table->decimal('min_order_value', 12, 2)->default(0.00);

            // Reputation
            $table->decimal('rating', 3, 2)->default(5.00);
            $table->unsignedInteger('total_ratings')->default(0);

            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('restaurant_operating_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained('restaurants')->onDelete('cascade');
            $table->unsignedTinyInteger('day_of_week'); // 0 = Sunday, 6 = Saturday
            $table->time('opening_time')->default('09:00:00');
            $table->time('closing_time')->default('23:00:00');
            $table->boolean('is_closed')->default(false);
            $table->unique(['restaurant_id', 'day_of_week']);
        });

        Schema::create('restaurant_bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->unique()->constrained('restaurants')->onDelete('cascade');
            $table->string('bank_name', 100);
            $table->string('account_holder_name', 100);
            $table->string('account_number', 50);
            $table->string('ifsc_code', 20);
            $table->string('upi_id', 50)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_bank_accounts');
        Schema::dropIfExists('restaurant_operating_hours');
        Schema::dropIfExists('restaurants');
    }
};
