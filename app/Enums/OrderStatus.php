<?php

namespace App\Enums;

enum OrderStatus: string
{
    case ACCEPTED = 'accepted';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
    case SHIPPED = 'shipped';
    case REJECTED = 'rejected';
    case CANCELLED = 'cancelled';

    /**
     * Human readable label in English
     */
    public function label(): string
    {
        return match($this) {
            self::ACCEPTED => 'Accepted',
            self::IN_PROGRESS => 'In Progress',
            self::COMPLETED => 'Completed',
            self::SHIPPED => 'Shipped',
            self::REJECTED => 'Rejected',
            self::CANCELLED => 'Cancelled',
        };
    }

    /**
     * Polish translation
     */
    public function pl(): string
    {
        return match($this) {
            self::ACCEPTED => 'Przyjęte',
            self::IN_PROGRESS => 'W realizacji',
            self::COMPLETED => 'Zakończone',
            self::SHIPPED => 'Wysłane',
            self::REJECTED => 'Odrzucone',
            self::CANCELLED => 'Anulowane',
        };
    }

    /**
     * Color for UI badges (HEX)
     */
    public function color(): string
    {
        return match($this) {
            self::ACCEPTED => '#0d6efd',      // blue
            self::IN_PROGRESS => '#ffc107',   // amber
            self::COMPLETED => '#198754',     // green
            self::SHIPPED => '#0dcaf0',       // cyan
            self::REJECTED => '#dc3545',      // red
            self::CANCELLED => '#6c757d',     // gray
        };
    }

    /**
     * Return all enum values as array of arrays for selects
     * [ 'value' => ..., 'label' => ..., 'pl' => ..., 'color' => ... ]
     */
    public static function toArray(): array
    {
        $out = [];
        foreach (self::cases() as $case) {
            $out[] = [
                'value' => $case->value,
                'label' => $case->label(),
                'pl' => $case->pl(),
                'color' => $case->color(),
            ];
        }
        return $out;
    }
}
