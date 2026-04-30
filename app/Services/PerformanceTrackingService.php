<?php

namespace App\Services;

use App\Events\PerformanceUpdated;
use App\Models\Machines;
use App\Models\OrderItemProductionEvent;
use App\Models\OrderItemProductionPlan;
use App\Models\ProductionPerformance;

class PerformanceTrackingService
{
    public function __construct(
        private readonly ProductionPerformance $productionPerformance,
        private readonly Machines $machines,
    ) {
    }

    public function storeFromPlan(
        OrderItemProductionPlan $plan,
        ?OrderItemProductionEvent $event,
        array $metrics
    ): ?ProductionPerformance {
        $hasAnyMetric = isset($metrics['norm_performance_percent'])
            || isset($metrics['norm_usage_percent'])
            || isset($metrics['actual_task_seconds'])
            || isset($metrics['norm_required_seconds']);

        if (!$hasAnyMetric) {
            return null;
        }

        $machine = $this->machines->newQuery()
            ->select(['id', 'department_id'])
            ->where('id', $plan->machine_id)
            ->first();

        $record = $this->productionPerformance->newQuery()->create([
            'order_item_production_plan_id' => $plan->id,
            'order_item_production_event_id' => $event?->id,
            'user_id' => $plan->assigned_user_id,
            'department_id' => $machine?->department_id,
            'machine_id' => $plan->machine_id,
            'operationmachine_id' => $plan->operationmachine_id,
            'norm_required_seconds' => isset($metrics['norm_required_seconds']) ? (int) $metrics['norm_required_seconds'] : null,
            'actual_task_seconds' => isset($metrics['actual_task_seconds']) ? (int) $metrics['actual_task_seconds'] : null,
            'norm_usage_percent' => isset($metrics['norm_usage_percent']) ? (float) $metrics['norm_usage_percent'] : null,
            'norm_performance_percent' => isset($metrics['norm_performance_percent']) ? (float) $metrics['norm_performance_percent'] : null,
            'completed_cycles' => isset($metrics['completed_cycles']) ? max(0, (int) $metrics['completed_cycles']) : null,
            'required_cycles' => isset($metrics['required_cycles']) ? max(1, (int) $metrics['required_cycles']) : null,
            'occurred_at' => isset($metrics['occurred_at']) ? $metrics['occurred_at'] : now(),
            'payload' => $metrics,
        ]);

        try {
            broadcast(new PerformanceUpdated($record));
        } catch (\Throwable) {
            // Reverb/WebSocket server unavailable — skip broadcast, core record already saved
        }

        return $record;
    }
}
