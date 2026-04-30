<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Machines;
use App\Models\Operationmachine;
use App\Models\ProductionPerformance;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProductionPerformanceSeeder extends Seeder
{
    public function run(): void
    {
        if (Department::query()->count() < 8) {
            Department::factory()->count(8 - Department::query()->count())->create();
        }

        $departments = Department::query()->get();

        foreach ($departments as $department) {
            $employeesCount = User::query()
                ->where('role', 'employee')
                ->where('department_id', $department->id)
                ->count();

            if ($employeesCount < 2) {
                User::factory()->count(2 - $employeesCount)->employee()->create([
                    'department_id' => $department->id,
                ]);
            }

            $machinesCount = Machines::query()
                ->where('department_id', $department->id)
                ->count();

            if ($machinesCount < 2) {
                $employeeIds = User::query()
                    ->where('role', 'employee')
                    ->where('department_id', $department->id)
                    ->pluck('id');

                $missingMachines = 2 - $machinesCount;
                for ($index = 0; $index < $missingMachines; $index++) {
                    Machines::factory()->create([
                        'department_id' => $department->id,
                        'user_id' => $employeeIds->random(),
                    ]);
                }
            }
        }

        $machines = Machines::query()->get(['id']);
        foreach ($machines as $machine) {
            $operationsCount = Operationmachine::query()->where('machine_id', $machine->id)->count();
            if ($operationsCount === 0) {
                Operationmachine::factory()->count(2)->create([
                    'machine_id' => $machine->id,
                ]);
            }
        }

        if (ProductionPerformance::query()->count() < 180) {
            ProductionPerformance::factory()->count(180 - ProductionPerformance::query()->count())->create();
        }
    }
}
