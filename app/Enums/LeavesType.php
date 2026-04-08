<?php

namespace App\Enums;

enum LeavesType: string
{
    case ANNUAL = 'annual';
    case SICK = 'sick';
    case UNPAID = 'unpaid';
    case PARENTAL = 'parental';
    case COMPASSIONATE = 'compassionate';
    case ON_DEMAND = 'on_demand';

    public function label(): string
    {
        return match($this) {
            self::ANNUAL => 'Urlop wypoczynkowy',
            self::SICK => 'Urlop zdrowotny',
            self::UNPAID => 'Urlop bezpłatny',
            self::PARENTAL => 'Urlop rodzicielski',
            self::COMPASSIONATE => 'Urlop okolicznościowy',
            self::ON_DEMAND => 'Urlop na żądanie',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::ANNUAL => 'blue',
            self::SICK => 'red',
            self::UNPAID => 'gray',
            self::PARENTAL => 'purple',
            self::COMPASSIONATE => 'yellow',
            self::ON_DEMAND => 'green',
        };
    }

    public function badge(): string
    {
        return match($this) {
            self::ANNUAL => 'bg-blue-100 text-blue-800',
            self::SICK => 'bg-red-100 text-red-800',
            self::UNPAID => 'bg-gray-100 text-gray-800',
            self::PARENTAL => 'bg-purple-100 text-purple-800',
            self::COMPASSIONATE => 'bg-yellow-100 text-yellow-800',
            self::ON_DEMAND => 'bg-green-100 text-green-800',
        };
    }

    public static function fromDatabase(string $value): ?self
    {
        $raw = trim(strtolower((string) $value));

        // historyczne/alternatywne wartości -> mapowanie na enum
        if ($raw === 'approved' || $raw === 'vacation') {
            $raw = self::ANNUAL->value;
        }

        return self::tryFrom($raw);
    }

    public static function values(): array
    {
        return array_map(fn(LeavesType $c) => $c->value, self::cases());
    }
}
