<?php

namespace App\Enums;

enum StatusAplication: string
{
	case PENDING = 'pending';
	case APPROVED = 'approved';
	case REJECTED = 'rejected';
	case EDITED = 'edited';

	/**
	 * Return array of values for migrations or schema enums
	 *
	 * @return string[]
	 */
	public static function all(): array
	{
		return array_map(fn(self $c) => $c->value, self::cases());
	}

	public static function labels(): array
	{
		return [
			self::PENDING->value => 'Oczekujący',
			self::APPROVED->value => 'Zatwierdzony',
			self::REJECTED->value => 'Odrzucony',
			self::EDITED->value => 'Edytowany',
		];
	}

	public static function label(string|self $status): string
	{
		$key = $status instanceof self ? $status->value : $status;
		$labels = self::labels();

		return $labels[$key] ?? $key;
	}

	public static function colors(): array
	{
		return [
			self::PENDING->value => '#FFD54F',
			self::APPROVED->value => '#10B981',
			self::REJECTED->value => '#EF4444',
			self::EDITED->value => '#3B82F6',
		];
	}

	public static function color(string|self $status): ?string
	{
		$key = $status instanceof self ? $status->value : $status;
		$colors = self::colors();

		return $colors[$key] ?? null;
	}

	public static function badgeClasses(): array
	{
		return [
			self::PENDING->value => 'bg-yellow-100 text-yellow-800',
			self::APPROVED->value => 'bg-green-100 text-green-800',
			self::REJECTED->value => 'bg-red-100 text-red-800',
			self::EDITED->value => 'bg-blue-100 text-blue-800',
		];
	}

	public static function badgeClass(string|self $status): ?string
	{
		$key = $status instanceof self ? $status->value : $status;
		$map = self::badgeClasses();

		return $map[$key] ?? null;
	}
}

