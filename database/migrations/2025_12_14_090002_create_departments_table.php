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
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('barcode', 13)->unique()->nullable();
            $table->string('location')->nullable();
            $table->integer('count_of_machine')->default(0);
            $table->integer('count_of_employee')->default(0);
            $table->integer('count_of_failure_machine')->default(0);
            $table->float('oee_coefficient')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
