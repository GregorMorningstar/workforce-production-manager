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
            $table->string('output_product_name')->nullable()->after('notes');
            $table->decimal('output_quantity', 10, 2)->nullable()->after('output_product_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('production_schema_steps', function (Blueprint $table) {
            $table->dropColumn(['output_product_name', 'output_quantity']);
        });
    }
};
