<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\ProductionPlan;

class ProductionPlanSeeder extends Seeder
{
    public function run(): void
    {
        // clear existing plans
        DB::table('production_plans')->delete();

        // create sample plans (factory ensures production_time_seconds is set)
        ProductionPlan::factory()->count(20)->create();

        echo "\nInserted production plans.\n";
    }
}
