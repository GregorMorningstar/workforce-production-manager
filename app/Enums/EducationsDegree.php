<?php

namespace App\Enums;

enum EducationsDegree: string
{
    case PRIMARY   = 'primary';    // szkoła podstawowa
    case GYMNASIUM = 'gymnasium';  // gimnazjum
    case SECONDARY = 'secondary';  // liceum / technikum (ogólne)
    case VOCATIONAL = 'vocational';// szkoła zawodowa / branżowa
    case BACHELOR  = 'bachelor';   // licencjat
    case ENGINEER  = 'engineer';   // inżynier
    case MASTER    = 'master';     // magister
    case DOCTOR    = 'doctor';     // doktor

    const EDUCATION_YEARS = [
        'primary'    => 0,  // szkoła podstawowa
        'gymnasium'  => 0,  // gimnazjum
        'vocational' => 3,  // zawodowa / branżowa
        'secondary'  => 4,  // liceum / technikum (ogólne)
        'bachelor'   => 8,  // licencjat (studia wyższe I stopnia)
        'engineer'   => 8,  // inżynier (studia wyższe I stopnia)
        'master'     => 8,  // magister (studia magisterskie)
        'doctor'     => 8   // doktor (studia doktoranckie)
    ];

    public function label(): string
    {
        return match ($this) {
            self::PRIMARY   => 'Szkoła podstawowa',
            self::GYMNASIUM => 'Gimnazjum',
            self::SECONDARY => 'Średnie',
            self::VOCATIONAL => 'Średnie zawodowe',
            self::BACHELOR  => 'Licencjat',
            self::ENGINEER  => 'Inżynier',
            self::MASTER    => 'Magister',
            self::DOCTOR    => 'Doktor',
        };
    }

    public static function selectOptions(): array
    {
        return array_map(
            fn(self $c) => ['value' => $c->value, 'label' => $c->label()],
            self::cases()
        );
    }

    /**
     * Zwraca liczbę lat przypisaną do nazwy poziomu.
     * Akceptuje instancję enuma, name (np. "PRIMARY") lub value (np. "primary").
     */
    public static function yearsFor(EducationsDegree|string|null $name): int
    {
        if ($name === null) {
            return 0;
        }

        // jeśli podano instancję enuma — użyj jej value
        if ($name instanceof self) {
            $key = $name->value;
            return self::EDUCATION_YEARS[$key] ?? 0;
        }

        $str = (string) $name;

        // jeśli podano nazwę case (np. "PRIMARY")
        foreach (self::cases() as $case) {
            if ($case->name === $str) {
                return self::EDUCATION_YEARS[$case->value] ?? 0;
            }
        }

        // traktuj jako value (np. "primary")
        return self::EDUCATION_YEARS[$str] ?? 0;
    }

    //pobieranie wszystkich poziomów edukacji jako tablica value
    public static function getAll(): array
    {
        return array_map(
            fn(self $c) => $c->value,
            self::cases()
        );
    }
}
