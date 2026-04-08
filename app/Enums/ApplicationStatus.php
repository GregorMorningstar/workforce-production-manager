<?php

namespace App\Enums;

enum ApplicationStatus: string
{
    case PENDING = 'pending';
    case APPROVED = 'approved';
    case WITHDRAWN = 'withdrawn';
    case REJECTED = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Oczekujący',
            self::APPROVED => 'Zatwierdzony',
            self::WITHDRAWN => 'Wycofany',
            self::REJECTED => 'Niezaakceptowany',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::PENDING => 'yellow',
            self::APPROVED => 'green',
            self::WITHDRAWN => 'gray',
            self::REJECTED => 'red',
        };
    }

    public static function options(): array
    {
        return array_map(
            fn(self $status) => [
                'value' => $status->value,
                'label' => $status->label(),
                'color' => $status->color(),
            ],
            self::cases()
        );
    }
}
