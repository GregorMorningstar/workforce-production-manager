<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_item_production_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_item_production_plan_id');
            $table->unsignedBigInteger('user_id')->nullable();

            $table->string('event_type', 32)->default('info')->index();
            $table->string('message', 1000);

            $table->unsignedInteger('norm_required_seconds')->nullable();
            $table->unsignedInteger('actual_task_seconds')->nullable();
            $table->decimal('norm_usage_percent', 7, 2)->nullable();
            $table->decimal('norm_performance_percent', 7, 2)->nullable();

            $table->json('payload')->nullable();
            $table->dateTime('occurred_at')->index();
            $table->timestamps();

            $table->index(['order_item_production_plan_id', 'occurred_at'], 'idx_plan_occurred_at');

            $table->foreign('order_item_production_plan_id', 'fk_oipe_plan')
                ->references('id')
                ->on('order_item_production_plans')
                ->cascadeOnDelete();

            $table->foreign('user_id', 'fk_oipe_user')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_item_production_events');
    }
};
