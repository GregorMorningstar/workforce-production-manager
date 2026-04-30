<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\ItemsFinishedGood;

class ItemsFinishedGoodFactory extends Factory
{
    protected $model = ItemsFinishedGood::class;

    private const CHAIR_MODELS = [
        ['name' => 'Krzeslo biurowe ergonomiczne AX-410', 'price_min' => 449, 'price_max' => 899],
        ['name' => 'Krzeslo konferencyjne tapicerowane CN-220', 'price_min' => 259, 'price_max' => 499],
        ['name' => 'Krzeslo stolowkowe stalowe ST-120', 'price_min' => 179, 'price_max' => 359],
        ['name' => 'Krzeslo gamingowe GT-900', 'price_min' => 699, 'price_max' => 1399],
        ['name' => 'Krzeslo barowe regulowane BR-77', 'price_min' => 229, 'price_max' => 549],
    ];

    public function definition()
    {
        $model = $this->faker->randomElement(self::CHAIR_MODELS);

        return [
            'name' => $model['name'] . ' ' . $this->faker->unique()->bothify('S#'),
            'description' => $this->faker->randomElement([
                'Krzeslo o konstrukcji stalowej, przeznaczone do intensywnej eksploatacji.',
                'Model z ergonomicznym profilem oparcia i zwiekszona trwaloscia laczen.',
                'Wersja produkcyjna z siedziskiem tapicerowanym i komponentami moduowymi.',
            ]),
            'image_path' => null,
            'barcode' => null,
            // Czas wylicza seeder na bazie rzeczywistych krokow.
            'time_of_production' => 0,
            'price' => $this->faker->randomFloat(2, $model['price_min'], $model['price_max']),
            'stock' => $this->faker->numberBetween(5, 120),
        ];
    }

    public function chairProductionModel(): self
    {
        return $this->state(function () {
            $model = $this->faker->randomElement(self::CHAIR_MODELS);

            return [
                'name' => $model['name'],
                'description' => 'Model produkowany seryjnie wg technologii: slusarnia -> spawalnia -> lakiernia -> tapiceria -> montaz -> kontrola -> pakowanie.',
                'time_of_production' => 0,
                'price' => $this->faker->randomFloat(2, $model['price_min'], $model['price_max']),
                'stock' => $this->faker->numberBetween(10, 80),
            ];
        });
    }
}
