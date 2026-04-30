<?php

namespace Database\Seeders;

use App\Models\ItemsFinishedGood;
use App\Models\Machines;
use App\Models\Operationmachine;
use App\Models\ProductionMaterial;
use App\Models\ProductionSchema;
use App\Models\ProductionSchemaStep;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChairProductionProcessSeeder extends Seeder
{
    public function run(): void
    {
        $materials = $this->seedMaterials();
        $operations = $this->seedOperations();

        $this->seedOperationMaterialConsumption($operations, $materials);
        $this->seedChairSchemas($operations, $materials);
    }

    private function seedMaterials(): array
    {
        $catalog = [
            ['name' => 'Profil stalowy 20x20x1.5', 'group_material' => 'metal', 'material_form' => 'beams', 'stock_empty_alarm' => 120, 'available_quantity' => 2200],
            ['name' => 'Rura stalowa fi 22x1.5', 'group_material' => 'metal', 'material_form' => 'beams', 'stock_empty_alarm' => 100, 'available_quantity' => 1800],
            ['name' => 'Pret stalowy fi 10', 'group_material' => 'metal', 'material_form' => 'beams', 'stock_empty_alarm' => 80, 'available_quantity' => 1300],
            ['name' => 'Pianka tapicerska T35 40 mm', 'group_material' => 'upholstery', 'material_form' => 'piece', 'stock_empty_alarm' => 60, 'available_quantity' => 950],
            ['name' => 'Tkanina obiciowa polyester 320 g', 'group_material' => 'upholstery', 'material_form' => 'roll', 'stock_empty_alarm' => 50, 'available_quantity' => 780],
            ['name' => 'Siatka mesh oparcia 3D', 'group_material' => 'upholstery', 'material_form' => 'roll', 'stock_empty_alarm' => 40, 'available_quantity' => 420],
            ['name' => 'Farba proszkowa RAL 9005', 'group_material' => 'finishing', 'material_form' => 'bag_25kg', 'stock_empty_alarm' => 30, 'available_quantity' => 350],
            ['name' => 'Sruby M6x25 kl.8.8', 'group_material' => 'assembly', 'material_form' => 'box', 'stock_empty_alarm' => 300, 'available_quantity' => 12000],
            ['name' => 'Nit stalowy 4x10', 'group_material' => 'assembly', 'material_form' => 'box', 'stock_empty_alarm' => 250, 'available_quantity' => 9000],
            ['name' => 'Stopki PP antyposlizgowe', 'group_material' => 'plastic', 'material_form' => 'piece', 'stock_empty_alarm' => 300, 'available_quantity' => 7000],
            ['name' => 'Kolka jezdne fi 50', 'group_material' => 'plastic', 'material_form' => 'set', 'stock_empty_alarm' => 120, 'available_quantity' => 1200],
            ['name' => 'Mechanizm podnoszenia gazowego', 'group_material' => 'mechanism', 'material_form' => 'piece', 'stock_empty_alarm' => 100, 'available_quantity' => 1400],
            ['name' => 'Karton transportowy 5W', 'group_material' => 'assembly', 'material_form' => 'piece', 'stock_empty_alarm' => 150, 'available_quantity' => 3000],
            ['name' => 'Etykieta logistyczna 100x150', 'group_material' => 'assembly', 'material_form' => 'roll', 'stock_empty_alarm' => 80, 'available_quantity' => 900],
        ];

        $result = [];
        foreach ($catalog as $row) {
            $material = ProductionMaterial::query()->updateOrCreate(
                ['name' => $row['name']],
                [
                    'description' => 'Material dla procesu produkcji krzesel.',
                    'group_material' => $row['group_material'],
                    'material_form' => $row['material_form'],
                    'stock_empty_alarm' => $row['stock_empty_alarm'],
                    'available_quantity' => $row['available_quantity'],
                ]
            );

            $result[$row['name']] = $material;
        }

        return $result;
    }

    private function seedOperations(): array
    {
        $definitions = [
            ['operation_name' => 'Ciecie profili stalowych', 'machine' => 'Automatyczna piła taśmowa', 'changeover_time' => 15],
            ['operation_name' => 'Spawanie ramy siedziska', 'machine' => 'Robot spawalniczy MIG/MAG', 'changeover_time' => 45],
            ['operation_name' => 'Szlifowanie i gratowanie ramy', 'machine' => 'Stół spawalniczy obrotowy', 'changeover_time' => 10],
            ['operation_name' => 'Lakierowanie proszkowe ramy', 'machine' => 'Kabina lakiernicza z filtracją', 'changeover_time' => 30],
            ['operation_name' => 'Polimeryzacja i studzenie', 'machine' => 'Piec tunelowy do polimerizacji', 'changeover_time' => 5],
            ['operation_name' => 'Ciecie pianki i tkaniny', 'machine' => 'Stacjonarny nóż do cięcia pianki', 'changeover_time' => 8],
            ['operation_name' => 'Szycie tapicerki siedziska', 'machine' => 'Automatyczna maszyna do szycia', 'changeover_time' => 20],
            ['operation_name' => 'Montaż koncowy krzesla', 'machine' => 'Stanowisko montażowe obrotowe', 'changeover_time' => 10],
            ['operation_name' => 'Kontrola jakosci i pakowanie', 'machine' => 'Automatyczna wiązarka kartonów', 'changeover_time' => 5],
        ];

        $result = [];

        foreach ($definitions as $definition) {
            $machine = Machines::query()
                ->where('name', $definition['machine'])
                ->orWhere('name', 'like', '%' . $definition['machine'] . '%')
                ->first();

            $operation = Operationmachine::query()->updateOrCreate(
                ['operation_name' => $definition['operation_name'], 'machine_id' => $machine?->id],
                [
                    'description' => 'Operacja procesu produkcji krzesel.',
                    'changeover_time' => $definition['changeover_time'],
                ]
            );

            $result[$definition['operation_name']] = $operation;
        }

        return $result;
    }

    private function seedOperationMaterialConsumption(array $operations, array $materials): void
    {
        $consumptionMap = [
            'Ciecie profili stalowych' => [
                ['material' => 'Profil stalowy 20x20x1.5', 'quantity' => 3.20, 'unit' => 'm'],
                ['material' => 'Rura stalowa fi 22x1.5', 'quantity' => 1.80, 'unit' => 'm'],
            ],
            'Spawanie ramy siedziska' => [
                ['material' => 'Pret stalowy fi 10', 'quantity' => 0.90, 'unit' => 'm'],
                ['material' => 'Nit stalowy 4x10', 'quantity' => 8.00, 'unit' => 'pcs'],
            ],
            'Lakierowanie proszkowe ramy' => [
                ['material' => 'Farba proszkowa RAL 9005', 'quantity' => 0.12, 'unit' => 'kg'],
            ],
            'Ciecie pianki i tkaniny' => [
                ['material' => 'Pianka tapicerska T35 40 mm', 'quantity' => 0.45, 'unit' => 'm2'],
                ['material' => 'Tkanina obiciowa polyester 320 g', 'quantity' => 0.75, 'unit' => 'm2'],
            ],
            'Szycie tapicerki siedziska' => [
                ['material' => 'Tkanina obiciowa polyester 320 g', 'quantity' => 0.85, 'unit' => 'm2'],
                ['material' => 'Siatka mesh oparcia 3D', 'quantity' => 0.55, 'unit' => 'm2'],
            ],
            'Montaż koncowy krzesla' => [
                ['material' => 'Sruby M6x25 kl.8.8', 'quantity' => 12.00, 'unit' => 'pcs'],
                ['material' => 'Mechanizm podnoszenia gazowego', 'quantity' => 1.00, 'unit' => 'pcs'],
                ['material' => 'Kolka jezdne fi 50', 'quantity' => 5.00, 'unit' => 'pcs'],
                ['material' => 'Stopki PP antyposlizgowe', 'quantity' => 4.00, 'unit' => 'pcs'],
            ],
            'Kontrola jakosci i pakowanie' => [
                ['material' => 'Karton transportowy 5W', 'quantity' => 1.00, 'unit' => 'pcs'],
                ['material' => 'Etykieta logistyczna 100x150', 'quantity' => 1.00, 'unit' => 'pcs'],
            ],
        ];

        foreach ($consumptionMap as $operationName => $materialRows) {
            $operation = $operations[$operationName] ?? null;
            if (!$operation) {
                continue;
            }

            $syncPayload = [];
            foreach ($materialRows as $materialRow) {
                $material = $materials[$materialRow['material']] ?? null;
                if (!$material) {
                    continue;
                }

                $syncPayload[$material->id] = [
                    'quantity' => $materialRow['quantity'],
                    'unit' => $materialRow['unit'],
                ];
            }

            $operation->materials()->sync($syncPayload);
        }
    }

    private function seedChairSchemas(array $operations, array $materials): void
    {
        $products = [
            [
                'name' => 'Krzeslo biurowe ergonomiczne AX-410',
                'description' => 'Krzeslo biurowe z mechanizmem podnoszenia, tapicerowanym siedziskiem i siatkowym oparciem.',
                'price' => 799.00,
                'stock' => 45,
                'variant_factor' => 1.00,
            ],
            [
                'name' => 'Krzeslo konferencyjne tapicerowane CN-220',
                'description' => 'Krzeslo konferencyjne do sal spotkan, rama stalowa, tapicerowane siedzisko i oparcie.',
                'price' => 429.00,
                'stock' => 72,
                'variant_factor' => 0.88,
            ],
            [
                'name' => 'Krzeslo stolowkowe stalowe ST-120',
                'description' => 'Krzeslo wysokiej wytrzymalosci do stref wspolnych, nacisk na trwalosc i latwosc serwisu.',
                'price' => 289.00,
                'stock' => 96,
                'variant_factor' => 0.80,
            ],
        ];

        $baseSteps = [
            [
                'step_number' => 1,
                'operation' => 'Ciecie profili stalowych',
                'material' => 'Profil stalowy 20x20x1.5',
                'required_quantity' => 3.20,
                'unit' => 'm',
                'production_time_seconds' => 180,
                'output_product_name' => 'Zestaw detali ramy',
                'output_quantity' => 1,
                'notes' => 'Ciecie wg listy detali, tolerancja dlugosci +/-1 mm.',
            ],
            [
                'step_number' => 2,
                'operation' => 'Spawanie ramy siedziska',
                'material' => 'Rura stalowa fi 22x1.5',
                'required_quantity' => 1.80,
                'unit' => 'm',
                'production_time_seconds' => 390,
                'output_product_name' => 'Rama po spawaniu',
                'output_quantity' => 1,
                'notes' => 'Spawanie punktowe + przetop ciagly w narozach.',
            ],
            [
                'step_number' => 3,
                'operation' => 'Szlifowanie i gratowanie ramy',
                'material' => 'Nit stalowy 4x10',
                'required_quantity' => 8,
                'unit' => 'pcs',
                'production_time_seconds' => 150,
                'output_product_name' => 'Rama przygotowana pod lakier',
                'output_quantity' => 1,
                'notes' => 'Usuniecie ostrych krawedzi i odpryskow spoiny.',
            ],
            [
                'step_number' => 4,
                'operation' => 'Lakierowanie proszkowe ramy',
                'material' => 'Farba proszkowa RAL 9005',
                'required_quantity' => 0.12,
                'unit' => 'kg',
                'production_time_seconds' => 300,
                'output_product_name' => 'Rama polakierowana',
                'output_quantity' => 1,
                'notes' => 'Naniesienie warstwy 70-90 um.',
            ],
            [
                'step_number' => 5,
                'operation' => 'Polimeryzacja i studzenie',
                'material' => 'Farba proszkowa RAL 9005',
                'required_quantity' => 0.00,
                'unit' => 'kg',
                'production_time_seconds' => 900,
                'output_product_name' => 'Rama gotowa do montazu',
                'output_quantity' => 1,
                'notes' => 'Wygrzewanie 180C przez 15 min + kontrolowane chlodzenie.',
            ],
            [
                'step_number' => 6,
                'operation' => 'Ciecie pianki i tkaniny',
                'material' => 'Pianka tapicerska T35 40 mm',
                'required_quantity' => 0.45,
                'unit' => 'm2',
                'production_time_seconds' => 240,
                'output_product_name' => 'Wklad siedziska',
                'output_quantity' => 1,
                'notes' => 'Ciecie wg szablonu CNC, zachowac kierunek dzianiny.',
            ],
            [
                'step_number' => 7,
                'operation' => 'Szycie tapicerki siedziska',
                'material' => 'Tkanina obiciowa polyester 320 g',
                'required_quantity' => 0.85,
                'unit' => 'm2',
                'production_time_seconds' => 540,
                'output_product_name' => 'Siedzisko tapicerowane',
                'output_quantity' => 1,
                'notes' => 'Szew podwojny, kontrola naciagu i rownosci przeszyc.',
            ],
            [
                'step_number' => 8,
                'operation' => 'Montaż koncowy krzesla',
                'material' => 'Mechanizm podnoszenia gazowego',
                'required_quantity' => 1,
                'unit' => 'pcs',
                'production_time_seconds' => 420,
                'output_product_name' => 'Krzeslo zmontowane',
                'output_quantity' => 1,
                'notes' => 'Dokręcenie srub wg momentu 8-10 Nm, montaz kolek i stopki.',
            ],
            [
                'step_number' => 9,
                'operation' => 'Kontrola jakosci i pakowanie',
                'material' => 'Karton transportowy 5W',
                'required_quantity' => 1,
                'unit' => 'pcs',
                'production_time_seconds' => 180,
                'output_product_name' => 'Krzeslo gotowe do wysylki',
                'output_quantity' => 1,
                'notes' => 'Kontrola funkcji mechanizmu i estetyki, etykieta logistyczna.',
            ],
        ];

        foreach ($products as $productData) {
            $item = ItemsFinishedGood::query()->updateOrCreate(
                ['name' => $productData['name']],
                [
                    'description' => $productData['description'],
                    'price' => $productData['price'],
                    'stock' => $productData['stock'],
                ]
            );

            $schema = ProductionSchema::query()->updateOrCreate(
                ['items_finished_good_id' => $item->id],
                ['name' => 'Schemat produkcji - ' . $item->name]
            );

            ProductionSchemaStep::query()->where('production_schema_id', $schema->id)->delete();

            $variantFactor = (float) $productData['variant_factor'];
            $totalSeconds = 0;

            foreach ($baseSteps as $step) {
                $operation = $operations[$step['operation']] ?? null;
                $material = $materials[$step['material']] ?? null;

                if (!$operation) {
                    continue;
                }

                $requiredQuantity = round(((float) $step['required_quantity']) * $variantFactor, 3);
                $stepSeconds = (int) round(((float) $step['production_time_seconds']) * $variantFactor);
                $totalSeconds += $stepSeconds;

                ProductionSchemaStep::query()->create([
                    'production_schema_id' => $schema->id,
                    'step_number' => (int) $step['step_number'],
                    'operationmachine_id' => $operation->id,
                    'machine_id' => $operation->machine_id,
                    'production_material_id' => $material?->id,
                    'required_quantity' => $requiredQuantity,
                    'unit' => $step['unit'],
                    'production_time_seconds' => $stepSeconds,
                    'output_product_name' => $step['output_product_name'],
                    'output_quantity' => (float) $step['output_quantity'],
                    'notes' => $step['notes'],
                ]);
            }

            $changeoverSeconds = Operationmachine::query()
                ->whereIn('id', ProductionSchemaStep::query()->where('production_schema_id', $schema->id)->pluck('operationmachine_id'))
                ->sum(DB::raw('changeover_time * 60'));

            $item->time_of_production = (int) round($totalSeconds + $changeoverSeconds);
            $item->save();
        }
    }
}
