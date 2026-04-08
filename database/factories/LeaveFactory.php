<?php

namespace Database\Factories;

use App\Enums\LeavesStatus;
use App\Enums\LeavesType;
use App\Models\Leaves;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

class LeaveFactory extends Factory
{
    protected $model = Leaves::class;

    public function definition(): array
    {
        $statuses = array_map(fn($e) => $e->value, LeavesStatus::cases());

        $start = $this->faker->dateTimeBetween('-1 month', '+3 months');
        $daysCount = $this->faker->numberBetween(1, 14); // od 1 do 14 dni urlopu
        $end = (clone $start)->modify('+' . ($daysCount - 1) . ' days'); // -1 bo liczymy włącznie

        $status = $this->faker->randomElement($statuses);

        $approvedBy = null;
        $approvedAt = null;
        $rejectionReason = null;

        if ($status === LeavesStatus::APPROVED->value) {
            $approvedBy = User::inRandomOrder()->first()?->id ?? User::factory();
            $approvedAt = $this->faker->dateTimeBetween($start, 'now')->format('Y-m-d H:i:s');
        }

        if ($status === LeavesStatus::REJECTED->value) {
            $rejectionReason = $this->faker->randomElement([
                'Niewystarczające uzasadnienie',
                'Konflikt z harmonogramem pracy',
                'Przekroczenie limitu urlopów',
                'Wymaga dodatkowych dokumentów',
                'Zbyt krótki okres wypowiedzenia'
            ]);
        }

        return [
            'user_id' => User::inRandomOrder()->first()?->id ?? User::factory(),
            'start_date' => $start->format('Y-m-d'),
            'end_date' => $end->format('Y-m-d'),
            'days' => $daysCount, // dodana kalkulacja dni
            'description' => $this->faker->optional(0.7)->randomElement([
                'Urlop wypoczynkowy z rodziną',
                'Potrzebuję odpoczynku',
                'Wakacje zaplanowane wcześniej',
                'Sprawy rodzinne do załatwienia',
                'Wyjazd służbowy',
                'Rekonwalescencja po chorobie'
            ]),
            'status' => $status,
            'approved_by' => $approvedBy,
            'approved_at' => $approvedAt,
            'rejection_reason' => $rejectionReason,
        ];
    }

    public function approved(): self
    {
        return $this->state(function () {
            return [
                'status' => LeavesStatus::APPROVED->value,
                'approved_by' => User::inRandomOrder()->first()?->id ?? User::factory(),
                'approved_at' => now(),
                'rejection_reason' => null,
            ];
        });
    }

    public function rejected(): self
    {
        return $this->state(function () {
            return [
                'status' => LeavesStatus::REJECTED->value,
                'approved_by' => null,
                'approved_at' => null,
                'rejection_reason' => $this->faker->randomElement([
                    'Niewystarczające uzasadnienie wniosku',
                    'Konflikt z harmonogramem zespołu',
                    'Przekroczenie rocznego limitu urlopów'
                ]),
            ];
        });
    }

    public function pending(): self
    {
        return $this->state(function () {
            return [
                'status' => LeavesStatus::PENDING->value,
                'approved_by' => null,
                'approved_at' => null,
                'rejection_reason' => null,
            ];
        });
    }

    public function forUser(int $userId): self
    {
        return $this->state(fn() => ['user_id' => $userId]);
    }
}
