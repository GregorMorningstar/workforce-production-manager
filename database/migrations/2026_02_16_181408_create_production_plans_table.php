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
        Schema::create('production_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_material_id')->nullable()->constrained('production_materials')->cascadeOnDelete();
            $table->dateTime('scheduled_at')->nullable()->comment('Planowana data/godzina produkcji');
            $table->integer('production_time_minutes')->nullable()->comment('Czas produkcji w minutach');
            $table->decimal('production_time_seconds', 10, 2)->comment('Czas produkcji w sekundach z dokladnoscia do 0.01');
            $table->integer('quantity')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_plans');
    }
};
