<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('machine_failure_repair_actions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('machine_failure_repair_id');
            $table->foreign('machine_failure_repair_id')->references('id')->on('machine_failure_repairs')->onDelete('cascade');
            $table->text('description');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamp('performed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('machine_failure_repair_actions');
    }
};
