<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\MaterialGroup;
use App\Enums\MaterialForm;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('production_materials', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('barcode')->unique()->nullable();

            $table->enum('group_material', MaterialGroup::values())->nullable();
            $table->enum('material_form', MaterialForm::values())->nullable();
            $table->integer('stock_empty_alarm')->default(0);
            $table->decimal('available_quantity', 10, 2)->default(0);
            $table->string('delivery_number')->nullable();
            $table->string('delivery_scan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_materials');
    }
};
