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
        Schema::create('operationmachines', function (Blueprint $table) {
            $table->id();
            $table->string('barcode', 13)->nullable();
            $table->foreignId('machine_id')->nullable()->constrained('machines')->cascadeOnDelete();
            // create column now without foreign key to avoid ordering issues
            $table->unsignedBigInteger('production_material_id')->nullable()->index();
            $table->string('operation_name');
            $table->text('description')->nullable();
            $table->float('changeover_time')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('operationmachines');
    }
};
