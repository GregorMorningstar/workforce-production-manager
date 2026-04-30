<?php

use App\Enums\OrderItemProductionPlanStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_item_production_plans', function (Blueprint $table) {
            $table->enum('status', array_map(fn ($case) => $case->value, OrderItemProductionPlanStatus::cases()))
                ->default(OrderItemProductionPlanStatus::DODANO_PRACOWNIKA->value)
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('order_item_production_plans', function (Blueprint $table) {
            $table->enum('status', array_map(fn ($case) => $case->value, OrderItemProductionPlanStatus::cases()))
                ->default(OrderItemProductionPlanStatus::ROZPOCZETO_PROCES->value)
                ->change();
        });
    }
};
