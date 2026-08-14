<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained('restaurants')->onDelete('cascade');
            $table->string('name', 100);
            $table->string('slug', 120);
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();

            $table->unique(['restaurant_id', 'slug']);
        });

        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained('restaurants')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('menu_categories')->onDelete('cascade');
            $table->string('name', 150)->index();
            $table->string('slug', 180);
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            
            // Pricing & Classification
            $table->decimal('base_price', 12, 2);
            $table->decimal('discount_price', 12, 2)->nullable();
            $table->string('food_type', 20)->default('VEG')->index(); // VEG, NON_VEG, EGG

            // Availability & Prep
            $table->boolean('is_available')->default(true)->index();
            $table->boolean('is_recommended')->default(false)->index();
            $table->unsignedSmallInteger('preparation_time_minutes')->default(15);
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['restaurant_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
        Schema::dropIfExists('menu_categories');
    }
};
