<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Operationmachine;

class OperationmachineFactory extends Factory
{
    protected $model = Operationmachine::class;

    private const CHAIR_OPERATIONS = [
        ['name' => 'Ciecie profili stalowych', 'changeover' => 15],
        ['name' => 'Spawanie ramy siedziska', 'changeover' => 45],
        ['name' => 'Szlifowanie i gratowanie ramy', 'changeover' => 10],
        ['name' => 'Lakierowanie proszkowe ramy', 'changeover' => 30],
        ['name' => 'Polimeryzacja i studzenie', 'changeover' => 5],
        ['name' => 'Ciecie pianki i tkaniny', 'changeover' => 8],
        ['name' => 'Szycie tapicerki siedziska', 'changeover' => 20],
        ['name' => 'Montaż koncowy krzesla', 'changeover' => 10],
        ['name' => 'Kontrola jakosci i pakowanie', 'changeover' => 5],
    ];

    public function definition()
    {
        $operation = $this->faker->randomElement(self::CHAIR_OPERATIONS);

        return [
            'barcode' => null,
            'machine_id' => null,
            'production_material_id' => null,
            'operation_name' => $operation['name'],
            'description' => 'Operacja technologiczna na linii produkcji krzesel.',
            'changeover_time' => $operation['changeover'],
        ];
    }

    public function chairProductionOperation(): self
    {
        return $this->state(function () {
            $operation = $this->faker->randomElement(self::CHAIR_OPERATIONS);

            return [
                'operation_name' => $operation['name'],
                'description' => 'Operacja dla procesu produkcyjnego krzesel.',
                'changeover_time' => $operation['changeover'],
            ];
        });
    }
}
