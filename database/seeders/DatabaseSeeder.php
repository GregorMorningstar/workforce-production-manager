<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Department;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Sprawdź czy departamenty już istnieją, jeśli nie - utwórz wszystkie z listy
        if (Department::count() === 0) {
            $names = [
                'Odlewnia',
                'Ślusarnia',
                'Lakiernia',
                'Spawalnia',
                'Tapiceria',
                'Montaż końcowy',
                'Kontrola jakości',
                'Pakowanie',
            ];
            foreach ($names as $n) {
                Department::create(['name' => $n, 'description' => $n]);
            }
        }

        // Sprawdź czy użytkownicy testowi już istnieją
        if (!User::where('email', 'admin@test.com')->exists()) {
            User::create([
                'name' => 'Administrator',
                'email' => 'admin@test.com',
                'password' => bcrypt('qwer1234'),
                'role' => 'admin',
                'department_id' => Department::inRandomOrder()->value('id'),
            ]);
        }

        if (!User::where('email', 'moderator@test.com')->exists()) {
            User::create([
                'name' => 'Moderator',
                'email' => 'moderator@test.com',
                'password' => bcrypt('qwer1234'),
                'role' => 'moderator',
                'department_id' => Department::inRandomOrder()->value('id'),
            ]);
        }

        if (!User::where('email', 'employee@test.com')->exists()) {
            User::create([
                'name' => 'Employee',
                'email' => 'employee@test.com',
                'password' => bcrypt('qwer1234'),
                'role' => 'employee',
                'department_id' => Department::inRandomOrder()->value('id'),
            ]);
        }

        $employeeCount = User::where('role', 'employee')->count();
        if ($employeeCount < 10) {
            User::factory(10 - $employeeCount)->create([
                'role' => 'employee'
            ]);
        }

        $this->call([
            \Database\Seeders\ItemsFinishedGoodSeeder::class,
            LeavesSeeder::class,
            \Database\Seeders\MachineSeeder::class,
            \Database\Seeders\OperationMachineSeeder::class,
            \Database\Seeders\ProductionMaterialSeeder::class,
            \Database\Seeders\ChairProductionProcessSeeder::class,
            \Database\Seeders\ProductionPlanSeeder::class,
            \Database\Seeders\ProductionPerformanceSeeder::class,
        ]);
    }
}
