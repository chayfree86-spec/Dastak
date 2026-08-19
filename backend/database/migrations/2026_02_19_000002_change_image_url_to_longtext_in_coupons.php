<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('coupons') && Schema::hasColumn('coupons', 'image_url')) {
            DB::statement('ALTER TABLE coupons MODIFY image_url LONGTEXT NULL');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('coupons') && Schema::hasColumn('coupons', 'image_url')) {
            DB::statement('ALTER TABLE coupons MODIFY image_url VARCHAR(500) NULL');
        }
    }
};
