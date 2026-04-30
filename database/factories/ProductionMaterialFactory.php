<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\ProductionMaterial;
use App\Models\Operationmachine;
use App\Enums\MaterialGroup;
use App\Enums\MaterialForm;

class ProductionMaterialFactory extends Factory
{
    protected $model = ProductionMaterial::class;

    private const CHAIR_MATERIALS = [
        ['name' => 'Profil stalowy 20x20x1.5', 'group' => 'metal', 'form' => 'beams', 'unit_qty' => [100, 1800]],
        ['name' => 'Rura stalowa fi 22x1.5', 'group' => 'metal', 'form' => 'beams', 'unit_qty' => [100, 1400]],
        ['name' => 'Pret stalowy fi 10', 'group' => 'metal', 'form' => 'beams', 'unit_qty' => [100, 1200]],
        ['name' => 'Pianka tapicerska T35 40 mm', 'group' => 'upholstery', 'form' => 'piece', 'unit_qty' => [200, 1600]],
        ['name' => 'Tkanina obiciowa polyester 320 g', 'group' => 'upholstery', 'form' => 'roll', 'unit_qty' => [150, 1200]],
        ['name' => 'Siatka mesh oparcia 3D', 'group' => 'upholstery', 'form' => 'roll', 'unit_qty' => [100, 800]],
        ['name' => 'Farba proszkowa RAL 9005', 'group' => 'finishing', 'form' => 'bag_25kg', 'unit_qty' => [50, 600]],
        ['name' => 'Sruby M6x25 kl.8.8', 'group' => 'assembly', 'form' => 'box', 'unit_qty' => [2000, 12000]],
        ['name' => 'Nit stalowy 4x10', 'group' => 'assembly', 'form' => 'box', 'unit_qty' => [1500, 9000]],
        ['name' => 'Stopki PP antyposlizgowe', 'group' => 'plastic', 'form' => 'piece', 'unit_qty' => [1000, 5000]],
    ];

    public function definition()
    {
        $materialNames = [
            'Noga dębowa',
            'Noga bukowa',
            'Rama stalowa',
            'Profil aluminiowy',
            'Pianka HR',
            'Tkanina obiciowa',
            'Skóra ekologiczna',
            'Śruba M6',
            'Śruba M8',
            'Nakładka antypoślizgowa',
            'Stopka gumowa',
            'Płyta MDF',
            'Taśma tapicerska',
            'Nici tapicerskie',
            'Siatka mesh',
            'Poduszka siedziska',
            'Zawias łącznik',
            'Element łączenia'
        ];

        return [
            // names more specific to chair production
            'name' => $this->faker->randomElement($materialNames) . ' ' . $this->faker->numberBetween(1, 99),
            'description' => $this->faker->optional()->sentence(),
            'barcode' => null,
            'group_material' => $this->faker->randomElement(MaterialGroup::values()),
            'material_form' => $this->faker->randomElement(MaterialForm::values()),
            'stock_empty_alarm' => $this->faker->numberBetween(0, 20),
            'available_quantity' => $this->faker->randomFloat(2, 0, 500),
        ];
    }

    public function configure()
    {
        $faker = $this->faker;

        return $this->afterCreating(function (ProductionMaterial $material) use ($faker) {
            // Prefer to attach existing operationmachines so materials match real operations.
            $count = $faker->numberBetween(1, 2);

            $ops = Operationmachine::inRandomOrder()->limit($count)->get();

            // If no existing operations, create minimal ones as fallback
            if ($ops->isEmpty()) {
                $ops = Operationmachine::factory()->count($count)->create([
                    'production_material_id' => $material->id,
                ]);
            }

            foreach ($ops as $op) {
                $material->operations()->attach($op->id, [
                    'quantity' => $faker->randomFloat(2, 0.1, 20),
                    'unit' => $faker->randomElement(['pcs', 'kg', 'm']),
                ]);
            }
        });
    }

    public function chairProductionMaterial(): self
    {
        return $this->state(function () {
            $material = $this->faker->randomElement(self::CHAIR_MATERIALS);

            return [
                'name' => $material['name'],
                'description' => 'Material technologiczny dla linii produkcyjnej krzesel.',
                'group_material' => $material['group'],
                'material_form' => $material['form'],
                'stock_empty_alarm' => $this->faker->numberBetween(30, 120),
                'available_quantity' => $this->faker->randomFloat(2, $material['unit_qty'][0], $material['unit_qty'][1]),
            ];
        });
    }
}
