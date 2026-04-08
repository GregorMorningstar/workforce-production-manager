<?php

namespace App\Enums;

enum MaterialForm: string
{
    case STRIPS = 'strips';
    case BEAMS = 'beams';
    case GRANULES = 'granules';
    case PIECE = 'piece';
    case SET = 'set';
    case ROLL = 'roll';
    case BOX = 'box';
    case BAG_25KG = 'bag_25kg';

    public function label(string $lang = 'pl'): string
    {
        if ($lang === 'pl') {
            return match ($this) {
                self::STRIPS => 'Sztapki',
                self::BEAMS => 'Belki',
                self::GRANULES => 'Granulat',
                self::PIECE => 'Sztuka',
                self::SET => 'Zestaw',
                self::ROLL => 'Rolka',
                self::BOX => 'Pudełko zbiorcze',
                self::BAG_25KG => 'Worek 25 kg',
            };
        }

        return $this->value;
    }

    public static function values(): array
    {
        return array_map(fn(self $c) => $c->value, self::cases());
    }

    public static function toArray(): array
    {
        return array_map(fn(self $c) => [
            'value' => $c->value,
            'label' => $c->label(),
        ], self::cases());
    }
}
