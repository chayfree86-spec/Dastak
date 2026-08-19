<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('coupons') && ! Schema::hasColumn('coupons', 'image_url')) {
            Schema::table('coupons', function (Blueprint $table) {
                $table->string('image_url', 500)->nullable()->after('restaurant_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('coupons') && Schema::hasColumn('coupons', 'image_url')) {
            Schema::table('coupons', function (Blueprint $table) {
                $table->dropColumn('image_url');
            });
        }
    }
};
