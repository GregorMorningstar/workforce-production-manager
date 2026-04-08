<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('production_schema_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_schema_id')->constrained('production_schemas')->onDelete('cascade');
            $table->unsignedInteger('step_number')->default(1);
            $table->string('barcode')->unique()->nullable()->default(null);
            $table->foreignId('operationmachine_id')->nullable()->constrained('operationmachines')->nullOnDelete();
            $table->foreignId('machine_id')->nullable()->constrained('machines')->nullOnDelete();
            $table->foreignId('production_material_id')->nullable()->constrained('production_materials')->nullOnDelete();
            $table->decimal('required_quantity', 12, 3)->nullable();
            $table->string('unit')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_schema_steps');
    }
};
