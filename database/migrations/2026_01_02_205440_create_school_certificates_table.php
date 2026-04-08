<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\StatusAplication;
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('school_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('barcode')->unique()->nullable();
            $table->enum('status', StatusAplication::all())->default(StatusAplication::PENDING);
            $table->string('school_name');
            $table->string('school_address');
            $table->integer('start_year');
            $table->integer('end_year')->nullable();
            $table->string('education_level');
            $table->string('certificate_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('school_certificates');
    }
};
