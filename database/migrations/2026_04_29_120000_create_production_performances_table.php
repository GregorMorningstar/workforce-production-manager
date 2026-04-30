<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('production_performances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_production_plan_id')
                ->nullable()
                ->constrained('order_item_production_plans')
                ->nullOnDelete();
            $table->foreignId('order_item_production_event_id')
                ->nullable()
                ->constrained('order_item_production_events')
                ->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignId('machine_id')->nullable()->constrained('machines')->nullOnDelete();
            $table->foreignId('operationmachine_id')->nullable()->constrained('operationmachines')->nullOnDelete();

            $table->unsignedInteger('norm_required_seconds')->nullable();
            $table->unsignedInteger('actual_task_seconds')->nullable();
            $table->decimal('norm_usage_percent', 7, 2)->nullable();
            $table->decimal('norm_performance_percent', 7, 2)->nullable();

            $table->dateTime('occurred_at')->index();
            $table->json('payload')->nullable();
            $table->timestamps();

            $table->index(['department_id', 'occurred_at'], 'idx_prod_perf_department_date');
            $table->index(['user_id', 'occurred_at'], 'idx_prod_perf_user_date');
            $table->index(['machine_id', 'occurred_at'], 'idx_prod_perf_machine_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_performances');
    }
};
