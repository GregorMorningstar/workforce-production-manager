<?php
use App\Enums\LeavesStatus;
use App\Enums\LeavesType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration
{    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('leaves', function (Blueprint $table) {
            $table->id();
            $table->string('barcode')->unique()->nullable(); // unikalny kod kreskowy dla wniosku
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // id użytkownika składającego wniosek, kasuj wnioski przy usunięciu użytkownika
            $table->date('start_date'); // data rozpoczęcia urlopu
            $table->date('end_date'); // data zakończenia urlopu
            $table->integer('days')->default(0);// liczba dni urlopu
            // rodzaj urlopu - używa wartości z enuma App\Enums\LeavesType
            $table->enum('type', array_map(fn($e) => $e->value, LeavesType::cases()))->default(LeavesType::ANNUAL->value)->index();
            $table->text('description')->nullable(); // opis/uzasadnienie urlopu
            // status wniosku - używa wartości z enuma App\Enums\LeavesStatus
            $table->enum('status', array_map(fn($e) => $e->value, LeavesStatus::cases()))->default(LeavesStatus::PENDING->value)->index(); // domyślnie 'pending'
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete(); // kto zatwierdził (nullable), ustaw na null gdy usunięty
            $table->timestamp('approved_at')->nullable(); // data i godzina zatwierdzenia
            $table->text('rejection_reason')->nullable(); // powód odrzucenia wniosku
            $table->timestamps(); // created_at i updated_at
        });    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaves');
    }
};
