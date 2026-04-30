<?php

namespace Database\Factories;

use App\Models\Department;
use App\Models\Machines;
use App\Models\Operationmachine;
use App\Models\ProductionPerformance;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductionPerformanceFactory extends Factory
{
    protected $model = ProductionPerformance::class;

    public function definition(): array
    {
        $department = Department::query()->inRandomOrder()->first() ?? Department::factory()->create();

        $user = User::query()
            ->where('role', 'employee')
            ->where('department_id', $department->id)
            ->inRandomOrder()
            ->first()
            ?? User::factory()->employee()->create(['department_id' => $department->id]);

        $machine = Machines::query()
            ->where('department_id', $department->id)
            ->inRandomOrder()
            ->first()
            ?? Machines::factory()->create([
                'department_id' => $department->id,
                'user_id' => $user->id,
            ]);

        $operation = Operationmachine::query()
            ->where('machine_id', $machine->id)
            ->inRandomOrder()
            ->first()
            ?? Operationmachine::factory()->create([
                'machine_id' => $machine->id,
            ]);

        $normRequiredSeconds = $this->faker->numberBetween(240, 5400);
        $actualTaskSeconds = max(60, (int) round($normRequiredSeconds * $this->faker->randomFloat(2, 0.7, 1.35)));
        $normUsagePercent = round(($actualTaskSeconds / $normRequiredSeconds) * 100, 2);
        $normPerformancePercent = round(($normRequiredSeconds / $actualTaskSeconds) * 100, 2);
        $occurredAt = $this->faker->dateTimeBetween('-90 days', 'now');

        return [
            'order_item_production_plan_id' => null,
            'order_item_production_event_id' => null,
            'user_id' => $user->id,
            'department_id' => $department->id,
            'machine_id' => $machine->id,
            'operationmachine_id' => $operation->id,
            'norm_required_seconds' => $normRequiredSeconds,
            'actual_task_seconds' => $actualTaskSeconds,
            'norm_usage_percent' => $normUsagePercent,
            'norm_performance_percent' => $normPerformancePercent,
            'completed_cycles' => 1,
            'required_cycles' => 1,
            'occurred_at' => $occurredAt,
            'payload' => [
                'source' => 'factory',
                'seeded' => true,
                'department_name' => $department->name,
                'machine_name' => $machine->name,
            ],
        ];
    }
}
