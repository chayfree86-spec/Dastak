<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->string('settlement_cycle', 20)->default('WEEKLY')->after('commission_rate'); // DAILY, WEEKLY, MONTHLY
            $table->unsignedSmallInteger('delivery_radius_km')->default(12)->after('settlement_cycle');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn(['settlement_cycle', 'delivery_radius_km']);
        });
    }
};
