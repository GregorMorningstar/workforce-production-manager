<?php

namespace App\Enums;

enum MachineFailureRepairsStatus: string
{
	case REPORTED = 'reported';
	case DIAGNOSIS = 'diagnosis';
	case WAITING_FOR_PARTS = 'waiting_for_parts';
	case REJECTED = 'rejected';
	case REPAIRED = 'repaired';
	case DEFERRED = 'deferred';

	public function label(): string
	{
		return match($this) {
			self::REPORTED => 'Reported',
			self::DIAGNOSIS => 'Diagnosis',
			self::WAITING_FOR_PARTS => 'Waiting for parts',
			self::REJECTED => 'Rejected',
			self::REPAIRED => 'Repaired',
			self::DEFERRED => 'Deferred',
		};
	}

	public function labelPl(): string
	{
		return match($this) {
			self::REPORTED => 'Zgłoszona',
			self::DIAGNOSIS => 'Diagnoza',
			self::WAITING_FOR_PARTS => 'Czeka na części',
			self::REJECTED => 'Odrzucona',
			self::REPAIRED => 'Naprawiony',
			self::DEFERRED => 'Odroczona',
		};
	}

	public static function toSelectArray(string $lang = 'pl'): array
	{
		$arr = [];
		foreach (self::cases() as $case) {
			$arr[$case->value] = $lang === 'en' ? $case->label() : $case->labelPl();
		}

		return $arr;
	}
}

