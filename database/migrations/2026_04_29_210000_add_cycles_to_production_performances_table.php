<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('production_performances', function (Blueprint $table) {
            $table->unsignedInteger('completed_cycles')->nullable()->after('norm_performance_percent');
            $table->unsignedInteger('required_cycles')->nullable()->after('completed_cycles');
        });
    }

    public function down(): void
    {
        Schema::table('production_performances', function (Blueprint $table) {
            $table->dropColumn(['completed_cycles', 'required_cycles']);
        });
    }
};
