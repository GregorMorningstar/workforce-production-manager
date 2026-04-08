<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Operationmachine;

class OperationmachineFactory extends Factory
{
    protected $model = Operationmachine::class;

    public function definition()
    {
        return [
            'barcode' => null,
            'machine_id' => null,
            'production_material_id' => null,
            'operation_name' => $this->faker->words(3, true),
            'description' => $this->faker->sentence(),
            'changeover_time' => $this->faker->numberBetween(0, 30),
        ];
    }
}
