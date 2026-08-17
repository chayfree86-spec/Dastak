<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Variant Groups (e.g. Size, Portion)
        Schema::create('menu_item_variant_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_item_id')->constrained('menu_items')->onDelete('cascade');
            $table->string('name', 100); // e.g., "Size", "Quantity"
            $table->unsignedSmallInteger('min_selection')->default(1);
            $table->unsignedSmallInteger('max_selection')->default(1);
            $table->boolean('is_required')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // 2. Variants (e.g. Regular, Medium, Large)
        Schema::create('menu_item_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('variant_group_id')->constrained('menu_item_variant_groups')->onDelete('cascade');
            $table->string('name', 100);
            $table->decimal('price', 12, 2);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_available')->default(true)->index();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // 3. Addon Groups (e.g. Extra Toppings, Dips, Sauces)
        Schema::create('menu_item_addon_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_item_id')->constrained('menu_items')->onDelete('cascade');
            $table->string('name', 100); // e.g. "Choose Dips", "Extra Cheese"
            $table->unsignedSmallInteger('min_selection')->default(0);
            $table->unsignedSmallInteger('max_selection')->default(5);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // 4. Addons (e.g. Mint Chutney, Cheese Slice, Extra Mayo)
        Schema::create('menu_item_addons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('addon_group_id')->constrained('menu_item_addon_groups')->onDelete('cascade');
            $table->string('name', 100);
            $table->decimal('price', 12, 2)->default(0.00);
            $table->boolean('is_available')->default(true)->index();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_item_addons');
        Schema::dropIfExists('menu_item_addon_groups');
        Schema::dropIfExists('menu_item_variants');
        Schema::dropIfExists('menu_item_variant_groups');
    }
};
