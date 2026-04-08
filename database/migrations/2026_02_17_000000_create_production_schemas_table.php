<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('production_schemas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('items_finished_good_id')->constrained('items_finished_goods')->onDelete('cascade');
            $table->string('name')->nullable();
            $table->string('barcode')->nullable()->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_schemas');
    }
};
