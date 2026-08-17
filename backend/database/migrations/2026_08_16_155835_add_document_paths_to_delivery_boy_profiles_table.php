<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_boy_profiles', function (Blueprint $table) {
            $table->string('aadhar_path')->nullable();
            $table->string('pan_path')->nullable();
            $table->string('license_path')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('delivery_boy_profiles', function (Blueprint $table) {
            $table->dropColumn(['aadhar_path', 'pan_path', 'license_path']);
        });
    }
};
