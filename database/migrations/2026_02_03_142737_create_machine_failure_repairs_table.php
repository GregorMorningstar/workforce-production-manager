<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\MachineFailureRepairsStatus;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('machine_failure_repairs', function (Blueprint $table) {
            $table->id();
            $table->string('barcode')->unique()->nullable();
            $table->foreignId('machine_failure_id')->constrained()->onDelete('cascade');
            $table->enum('status', array_column(MachineFailureRepairsStatus::cases(), 'value'))->default(MachineFailureRepairsStatus::REPORTED->value);
            $table->float('cost')->nullable();
            $table->text('description')->nullable();
            $table->dateTime('started_at')->useCurrent();
            $table->dateTime('finished_at')->nullable();
            $table->string('repair_order_no')->nullable();//dodany jaki pierwszy barcode z recordow dotyczacych naprawy
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('machine_failure_repairs');
    }
};
