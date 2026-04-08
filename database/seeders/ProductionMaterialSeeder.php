<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductionMaterial;

class ProductionMaterialSeeder extends Seeder
{
    public function run(): void
    {
        // clear existing
        \Illuminate\Support\Facades\DB::table('production_materials')->delete();

        // create 10 sample materials using factory (factories attach operations)
        ProductionMaterial::factory()->count(10)->create();

        echo "Inserted production materials via factory.\n";
    }
}
