<?php

namespace App\Enums;

enum OrderItemProductionPlanStatus: string
{
    case DODANO_PRACOWNIKA = 'dodano_pracownika';
    case ROZPOCZETO_PROCES = 'rozpoczeto_proces';
    case ZAKONCZONO_PROCES = 'zakonczono_proces';
    case ODRZUCONO_PROCES = 'odrzucono_proces';

    public function label(): string
    {
        return match ($this) {
            self::DODANO_PRACOWNIKA => 'Dodano pracownika',
            self::ROZPOCZETO_PROCES => 'Rozpoczęto proces',
            self::ZAKONCZONO_PROCES => 'Zakończono proces',
            self::ODRZUCONO_PROCES => 'Odrzucono proces',
        };
    }
}
