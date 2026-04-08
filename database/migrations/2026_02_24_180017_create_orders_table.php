<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\OrderStatus;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name')->nullable()->comment('Nazwa klienta');
            $table->string('barcode')->nullable()->unique()->comment('Kod kreskowy');
            $table->string('status')->default(OrderStatus::ACCEPTED->value)->comment('Status zamówienia');
            $table->datetime('received_at')->default(now())->comment('Data przyjęcia zamówienia');
            $table->datetime('planned_production_at')->nullable()->comment('Planowany czas produkcji');
            $table->datetime('finished_at')->nullable()->comment('Planowany czas zakończenia');
            $table->datetime('real_finished_at')->nullable()->comment('Rzeczywisty czas zakończenia');
            $table->text('description')->nullable()->comment('Opis');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
