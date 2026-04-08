<?php

namespace App\Enums;

enum MaterialGroup: string
{
	case METAL = 'metal';
	case PLASTIC = 'plastic';
	case MECHANISM = 'mechanism';
	case UPHOLSTERY = 'upholstery';
	case ASSEMBLY = 'assembly';
	case FINISHING = 'finishing';

	public function label(string $lang = 'pl'): string
	{
		if ($lang === 'pl') {
			return match ($this) {
				self::METAL => 'Metal',
				self::PLASTIC => 'Tworzywo (plastik)',
				self::MECHANISM => 'Mechanizm',
				self::UPHOLSTERY => 'Tapicerka',
				self::ASSEMBLY => 'Montaż',
				self::FINISHING => 'Wykończenie',
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

