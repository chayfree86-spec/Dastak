<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('customer_profiles', 'anniversary_date')) {
                $table->date('anniversary_date')->nullable()->after('date_of_birth');
            }
            if (!Schema::hasColumn('customer_profiles', 'dietary_preference')) {
                $table->string('dietary_preference', 50)->nullable()->after('gender');
            }
            if (!Schema::hasColumn('customer_profiles', 'taste_preferences')) {
                $table->json('taste_preferences')->nullable()->after('preferences');
            }
        });
    }

    public function down(): void
    {
        Schema::table('customer_profiles', function (Blueprint $table) {
            $table->dropColumn(['anniversary_date', 'dietary_preference', 'taste_preferences']);
        });
    }
};
