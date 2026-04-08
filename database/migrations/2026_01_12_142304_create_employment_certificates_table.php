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
        Schema::create('employment_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('barcode')->nullable()->unique();
            $table->enum('status', StatusAplication::all())->default(StatusAplication::PENDING);
            $table->string('nip');
            $table->string('company_name');
            $table->string('street');
            $table->string('zip_code');
            $table->string('city');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('position');
            $table->text('additional_info')->nullable();
            $table->string('work_certificate_file_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employment_certificates');
    }
};
