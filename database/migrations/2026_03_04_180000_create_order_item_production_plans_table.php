<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\OrderItemProductionPlanStatus;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_item_production_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('order_item_id')->constrained('order_items')->cascadeOnDelete();
            $table->foreignId('items_finished_good_id')->nullable()->constrained('items_finished_goods')->nullOnDelete();
            $table->string('barcode', 13)->nullable()->unique();

            $table->foreignId('production_schema_id')->nullable()->constrained('production_schemas')->nullOnDelete();
            $table->foreignId('production_schema_step_id')->nullable()->constrained('production_schema_steps')->nullOnDelete();

            $table->foreignId('machine_id')->nullable()->constrained('machines')->nullOnDelete();
            $table->foreignId('operationmachine_id')->nullable()->constrained('operationmachines')->nullOnDelete();
            $table->foreignId('production_material_id')->nullable()->constrained('production_materials')->nullOnDelete();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->dateTime('planned_start_at')->nullable();
            $table->dateTime('planned_end_at')->nullable();

            $table->unsignedInteger('order_quantity')->default(1);
            $table->decimal('required_quantity_per_unit', 12, 3)->nullable();
            $table->decimal('required_total_quantity', 12, 3)->nullable();
            $table->string('unit', 32)->nullable();

            $table->enum('status', array_map(fn ($case) => $case->value, OrderItemProductionPlanStatus::cases()))
                ->default(OrderItemProductionPlanStatus::ROZPOCZETO_PROCES->value)
                ->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['order_item_id', 'production_schema_step_id'], 'uq_order_item_step_plan');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_item_production_plans');
    }
};
