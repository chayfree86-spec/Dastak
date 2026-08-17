<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_charge_rules', function (Blueprint $table) {
            $table->id();
            $table->string('type', 100); // e.g. "Distance Tier 1", "Free Delivery"
            $table->decimal('min_km', 6, 2)->nullable();
            $table->decimal('max_km', 6, 2)->nullable();
            $table->decimal('min_order', 12, 2)->nullable();
            $table->decimal('fee', 12, 2)->default(0.00);
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_charge_rules');
    }
};
