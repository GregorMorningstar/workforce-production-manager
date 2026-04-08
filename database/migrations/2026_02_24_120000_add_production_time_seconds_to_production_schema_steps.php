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
        Schema::table('production_schema_steps', function (Blueprint $table) {
            // add seconds with 2 decimal places, default 0.00 to avoid null issues for existing rows
            $table->decimal('production_time_seconds', 10, 2)->default(0.00)->after('output_quantity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('production_schema_steps', function (Blueprint $table) {
            $table->dropColumn('production_time_seconds');
        });
    }
};
