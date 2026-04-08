<?php

namespace Database\Factories;

use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Department>
 */
class DepartmentFactory extends Factory
{
    protected $model = Department::class;
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $names = [
            'Odlewnia',
            'Ślusarnia',
            'Lakiernia',
            'Spawalnia',
            'Tapiceria',
            'Montaż końcowy',
            'Kontrola jakości',
            'Pakowanie',
            'Magazyn',
            ];

        return [
            'name' => $this->faker->unique()->randomElement($names),
            'description' => $this->faker->sentence(),
        ];
    }
}
