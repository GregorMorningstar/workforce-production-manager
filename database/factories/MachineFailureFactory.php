<?php

namespace Database\Factories;

use App\Models\MachineFailure;
use App\Models\Machines;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class MachineFailureFactory extends Factory
{
    protected $model = MachineFailure::class;

    public function definition(): array
    {
        return [
            'machine_id'          => Machines::factory(),
            'user_id'             => User::factory()->employee(),
            'failure_rank'        => $this->faker->numberBetween(1, 10),
            'failure_description' => $this->faker->sentence(10),
            'reported_at'         => now()->toDateTimeString(),
            'finished_repaired_at'=> null,
            'total_cost'          => 0,
        ];
    }

    /** Stan: awaria naprawiona */
    public function repaired(): self
    {
        return $this->state(fn () => [
            'finished_repaired_at' => now(),
        ]);
    }
}
