<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Machines;
use App\Enums\MachineStatus;
use Illuminate\Support\Str;

class MachinesFactory extends Factory
{
    protected $model = Machines::class;

    public function definition()
    {
        $machineNames = ['Frezarka', 'Tokarka', 'Wiertarka', 'Prasa', 'Szlifierka', 'Nożyce', 'Spawarka', 'Dźwig', 'Pilot', 'Robot'];

        return [
            'name' => $this->faker->randomElement($machineNames) . ' ' . $this->faker->numberBetween(1, 99),
            'model' => $this->faker->bothify('M-####'),
            'serial_number' => strtoupper($this->faker->bothify('SN#######')),
            'barcode' => null, // generowane w modelu jeśli masz mutator
            'year_of_production' => $this->faker->numberBetween(2010, 2024),
            'description' => $this->faker->optional()->sentence(),
            'status' => $this->faker->randomElement(MachineStatus::cases())->value,
            'user_id' => \App\Models\User::where('role', 'employee')->inRandomOrder()->value('id'), 
            'department_id' => null, // możesz przypisać losowy department
            'image_path' => null, // seeder pobierze obraz i zapisze ścieżkę
            'last_failure_date' => $this->faker->optional()->dateTimeBetween('-1 year', 'now'),
        ];
    }
}
