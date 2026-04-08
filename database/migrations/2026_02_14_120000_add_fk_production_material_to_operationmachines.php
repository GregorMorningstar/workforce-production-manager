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
        Schema::table('operationmachines', function (Blueprint $table) {
            // add foreign key constraint now that production_materials table exists
            $table->foreign('production_material_id')->references('id')->on('production_materials')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('operationmachines', function (Blueprint $table) {
            $table->dropForeign(['production_material_id']);
        });
    }
};
