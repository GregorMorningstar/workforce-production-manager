<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\MachineStatus;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('machines', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('model')->nullable();
            $table->string('serial_number')->unique()->nullable();
            $table->string('barcode', 13)->nullable();
            $table->integer('year_of_production')->nullable();
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->timestamp('last_failure_date')->nullable();

            // owner (single user owner) - optional
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            // department - one department per machine
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->enum('status', array_map(function($c){ return $c->value; }, MachineStatus::cases()))
                  ->default(MachineStatus::INACTIVE->value);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // drop dependent tables first to avoid foreign key constraint errors
        Schema::dropIfExists('machine_failures');
        Schema::dropIfExists('operationmachines');
        Schema::dropIfExists('machines');
    }
};
