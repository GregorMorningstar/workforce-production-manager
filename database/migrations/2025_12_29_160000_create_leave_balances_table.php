<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('leave_balances', function (Blueprint $table) {
            $table->id();
            // Identyfikator rekordu
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Identyfikator użytkownika
            $table->integer('year')->index();
            // Rok
            // typ urlopu (np. 'vacation', 'sick')
            // Typ urlopu (np. 'vacation' — urlop wypoczynkowy, 'sick' — zwolnienie lekarskie)
            $table->string('leave_type')->default('vacation')->index();
            $table->string('barcode')->unique()->nullable();
            // Kod kreskowy (unikalny identyfikator)

            // saldo i pola pomocnicze
            // Dni przysługujące (liczba dni urlopu przyznana na rok)
            $table->integer('entitlement_days')->default(20);
            // Dni wykorzystane (ile dni już wykorzystano)
            $table->integer('used_days')->default(0);
            // Dni pozostałe (pozostały limit dni)
            $table->integer('remaining_days')->default(20);
            // Dni na wniosek (dostępne dni do wniosków)
            $table->integer('request_days')->default(0);
            // Wykorzystane dni z wniosku (ile dni z puli wniosków zostało użyte)
            $table->integer('request_used')->default(0);
            // Lata stażu (przepracowane lata, wpływające na wymiar urlopu)
            $table->decimal('seniority_years', 8, 4)->default(0);
            // Czas pracy (miesiące/miara stażu pracy używana w obliczeniach)
            $table->decimal('work_time', 8, 2)->default(0);
            // Czas edukacji (miesiące/okresy edukacyjne wpływające na uprawnienia)
            $table->decimal('education_time', 8, 2)->default(0);
            // Data rozpoczęcia zatrudnienia
            $table->date('employment_start_date')->nullable();

            // unikalność dla user + rok + typ urlopu
            $table->unique(['user_id', 'year', 'leave_type']);

            // Data utworzenia i ostatniej modyfikacji rekordu
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_balances');
    }
};
