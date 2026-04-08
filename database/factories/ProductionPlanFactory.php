<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\ProductionPlan;
use App\Models\ProductionMaterial;

class ProductionPlanFactory extends Factory
{
    protected $model = ProductionPlan::class;

    public function definition()
    {
        return [
            'production_material_id' => ProductionMaterial::inRandomOrder()->value('id') ?: null,
            'scheduled_at' => $this->faker->dateTimeBetween('-1 week', '+2 weeks'),
            'production_time_minutes' => $this->faker->numberBetween(1, 480),
            'production_time_seconds' => $this->faker->randomFloat(2, 30, 36000),
            'quantity' => $this->faker->numberBetween(1, 500),
        ];
    }
}
