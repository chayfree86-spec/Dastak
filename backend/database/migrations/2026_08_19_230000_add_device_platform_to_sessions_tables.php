<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('app_verification_sessions')) {
            Schema::table('app_verification_sessions', function (Blueprint $table) {
                if (! Schema::hasColumn('app_verification_sessions', 'device_platform')) {
                    $table->enum('device_platform', ['mobile', 'desktop'])->default('mobile')->after('device_identifier_hash');
                }
            });
        }

        if (Schema::hasTable('app_device_sessions')) {
            Schema::table('app_device_sessions', function (Blueprint $table) {
                if (! Schema::hasColumn('app_device_sessions', 'device_platform')) {
                    $table->enum('device_platform', ['mobile', 'desktop'])->default('mobile')->after('device_name');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('app_verification_sessions')) {
            Schema::table('app_verification_sessions', function (Blueprint $table) {
                if (Schema::hasColumn('app_verification_sessions', 'device_platform')) {
                    $table->dropColumn('device_platform');
                }
            });
        }

        if (Schema::hasTable('app_device_sessions')) {
            Schema::table('app_device_sessions', function (Blueprint $table) {
                if (Schema::hasColumn('app_device_sessions', 'device_platform')) {
                    $table->dropColumn('device_platform');
                }
            });
        }
    }
};
