<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\ItemsFinishedGood;

class ItemsFinishedGoodFactory extends Factory
{
    protected $model = ItemsFinishedGood::class;

    public function definition()
    {
        $chairNames = [
            'Krzesło biurowe',
            'Krzesło konferencyjne',
            'Krzesło tapicerowane',
            'Fotel obrotowy',
            'Krzesło kuchenne',
            'Krzesło barowe',
            'Krzesło dziecięce',
            'Krzesło rozkładane',
            'Krzesło designerskie',
            'Fotel relaksacyjny'
        ];

        return [
            'name' => $this->faker->unique()->randomElement($chairNames) . ' ' . $this->faker->bothify('Model-##'),
            'description' => $this->faker->sentence(),
            'image_path' => null,
            'barcode' => null,
            // store production time in seconds (30s .. 3600s)
            'time_of_production' => $this->faker->numberBetween(30, 3600),
            'price' => $this->faker->randomFloat(2, 50, 1500),
            'stock' => $this->faker->numberBetween(0, 200),
        ];
    }
}
