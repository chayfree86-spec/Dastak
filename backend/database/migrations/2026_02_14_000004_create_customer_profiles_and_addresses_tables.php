<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('gender', 20)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('alternate_mobile', 20)->nullable();
            $table->unsignedInteger('loyalty_points')->default(0);
            $table->json('preferences')->nullable();
            $table->timestamps();
        });

        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('type', 20)->default('HOME')->index();
            $table->string('contact_name');
            $table->string('contact_mobile', 20);
            $table->string('address_line1');
            $table->string('address_line2')->nullable();
            $table->string('landmark')->nullable();
            $table->string('city', 100)->index();
            $table->string('state', 100)->default('Uttar Pradesh');
            $table->string('pincode', 10)->index();
            $table->decimal('latitude', 10, 7)->nullable()->index();
            $table->decimal('longitude', 10, 7)->nullable()->index();
            $table->boolean('is_default')->default(false)->index();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addresses');
        Schema::dropIfExists('customer_profiles');
    }
};
