<?php

namespace App\Enums;

enum MachineStatus: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case MAINTENANCE = 'maintenance';
    case DECOMMISSIONED = 'decommissioned';
    case WORKING = 'working';
    case FORCED_DOWNTIME = 'forced_downtime';
    case BREAKDOWN = 'breakdown';

    public function label(string $lang = 'pl'): string
    {
        if ($lang === 'pl') {
            return match ($this) {
                self::ACTIVE => 'aktywny',
                self::INACTIVE => 'nieaktywny',
                self::MAINTENANCE => 'serwis / konserwacja',
                self::DECOMMISSIONED => 'wycofana',
                self::WORKING => 'pracuje',
                self::FORCED_DOWNTIME => 'postój wymuszony',
                self::BREAKDOWN => 'awaria',
            };
        }

        return $this->value;
    }

    public static function values(): array
    {
        return array_map(fn(self $c) => $c->value, self::cases());
    }

    /**
     * Zwraca klasy Tailwind dla badge'a (background + text).
     * - WORKING: zielony
     * - BREAKDOWN: czerwony
     * - ACTIVE: niebieski
     * - INACTIVE: szary
     * - MAINTENANCE: czarny (serwis)
     * - DECOMMISSIONED: ciemny (wycofana)
     * - FORCED_DOWNTIME: żółty (postój wymuszony)
     */
    public function colorClasses(): string
    {
        return match ($this) {
            self::WORKING => 'bg-green-100 text-green-800',
            self::BREAKDOWN => 'bg-red-100 text-red-800',
            self::ACTIVE => 'bg-blue-100 text-blue-800',
            self::INACTIVE => 'bg-slate-100 text-slate-800',
            self::MAINTENANCE => 'bg-black text-white',
            self::DECOMMISSIONED => 'bg-gray-700 text-white',
            self::FORCED_DOWNTIME => 'bg-yellow-100 text-yellow-800',
        };
    }

    /**
     * Hex color for use as inline border color on frontend
     */
    public function colorHex(): string
    {
        return match ($this) {
            self::WORKING => '#10B981', // green-500
            self::BREAKDOWN => '#EF4444', // red-500
            self::ACTIVE => '#3B82F6', // blue-500
            self::INACTIVE => '#94A3B8', // slate-400
            self::MAINTENANCE => '#000000', // black
            self::DECOMMISSIONED => '#374151', // gray-700
            self::FORCED_DOWNTIME => '#F59E0B', // yellow-500
        };
    }

    /**
     * Serialisable array for frontend (value, label, classes string, color hex)
     */
    public static function toArray(): array
    {
        return array_map(fn(self $c) => [
            'value' => $c->value,
            'label' => $c->label(),
            'classes' => $c->colorClasses(),
            'color' => $c->colorHex(),
        ], self::cases());
    }
}
