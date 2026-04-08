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
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('barcode')->unique()->nullable();
            $table->string('phone', 15)->nullable();
            $table->string('pesel', 11)->nullable()->unique();
            $table->text('address')->nullable();
            $table->string('profile_photo')->nullable(); // ścieżka do zdjęcia
            $table->date('birth_date')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('emergency_contact_name')->nullable(); // imię kontaktu awaryjnego
            $table->string('emergency_contact_phone', 15)->nullable(); // telefon kontaktu awaryjnego
            $table->timestamps();

            $table->index('user_id');
            $table->index('pesel');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
