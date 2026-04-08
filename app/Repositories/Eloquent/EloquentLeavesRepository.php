<?php

namespace App\Repositories\Eloquent;

use App\Repositories\Contracts\LeavesRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Carbon\Carbon;
use App\Models\Leaves;
use App\Models\LeaveBalance;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use App\Enums\LeavesType;


class EloquentLeavesRepository implements LeavesRepositoryInterface
{
    public function __construct(private readonly Leaves $leaves,
     private readonly LeaveBalance $leaveBalance,
     private readonly User $user,
     private readonly LeaveBalance $leavesBalance)
    {
    }

    public function getAllLeavesByUserId(int $userId): Collection
    {
        return $this->leaves->where('user_id', $userId)->with('user')->get();
    }

    public function store(array $data): Leaves
    {
        return $this->leaves->create($data);
    }

    public function getLeavesById(int $id): ?Leaves
    {
        return $this->leaves->with('user')->find($id);
    }

    public function updateLeave(int $id, array $data): bool
    {
        $leave = $this->leaves->find($id);
        if (!$leave) {
            return false;
        }
        return $leave->update($data);
    }

    public function deleteLeave(int $id): bool
    {
        $leave = $this->leaves->find($id);
        if (!$leave) {
            return false;
        }
        return $leave->delete();
    }

    public function getAllLeaves(): Collection
    {
        return $this->leaves->with('user')->orderBy('start_date', 'desc')->get();
    }

    /**
     * Pobierz wszystkie urlopy w określonym przedziale dat
     */
    public function getLeavesInDateRange(Carbon $startDate, Carbon $endDate): Collection
    {
        return $this->leaves
            ->with('user')
            ->where(function($query) use ($startDate, $endDate) {
                $query->whereBetween('start_date', [$startDate, $endDate])
                      ->orWhereBetween('end_date', [$startDate, $endDate])
                      ->orWhere(function($q) use ($startDate, $endDate) {
                          $q->where('start_date', '<=', $startDate)
                            ->where('end_date', '>=', $endDate);
                      });
            })
            ->orderBy('start_date')
            ->get();
    }

    /**
     * Pobierz urlopy dla konkretnego użytkownika w przedziale dat
     */
    public function getUserLeaves(int $userId, ?Carbon $startDate = null, ?Carbon $endDate = null): Collection
    {
        $query = $this->leaves->with('user')->where('user_id', $userId);

        if ($startDate && $endDate) {
            $query->where(function($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate, $endDate])
                  ->orWhereBetween('end_date', [$startDate, $endDate])
                  ->orWhere(function($subQ) use ($startDate, $endDate) {
                      $subQ->where('start_date', '<=', $startDate)
                           ->where('end_date', '>=', $endDate);
                  });
            });
        }

        return $query->orderBy('start_date')->get();
    }

    /**
     * Pobierz wszystkie aktywne urlopy
     */
    public function getActiveLeaves(): Collection
    {
        $today = Carbon::today();
        return $this->leaves
            ->with('user')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->where('status', 'approved')
            ->orderBy('start_date')
            ->get();
    }

    /**
     * Pobierz urlopy według statusu
     */
    public function getLeavesByStatus(string $status): Collection
    {
        return $this->leaves
            ->with('user')
            ->where('status', $status)
            ->orderBy('start_date', 'desc')
            ->get();
    }

    /**
     * Pobierz statystyki urlopów
     */
    public function getLeavesStatistics(): array
    {
        $today = Carbon::today();
        $currentMonth = Carbon::now()->startOfMonth();
        $nextMonth = Carbon::now()->addMonth()->endOfMonth();

        return [
            'total_leaves' => $this->leaves->count(),
            'pending_leaves' => $this->leaves->where('status', 'pending')->count(),
            'approved_leaves' => $this->leaves->where('status', 'approved')->count(),
            'rejected_leaves' => $this->leaves->where('status', 'rejected')->count(),
            'active_leaves' => $this->leaves
                ->where('start_date', '<=', $today)
                ->where('end_date', '>=', $today)
                ->where('status', 'approved')
                ->count(),
            'upcoming_leaves' => $this->leaves
                ->where('start_date', '>', $today)
                ->where('start_date', '<=', $nextMonth)
                ->where('status', 'approved')
                ->count(),
        ];
    }

    /**
     * Pobierz wszystkie oczekujące urlopy
     */
    public function getPendingLeaves(): Collection
    {
        return $this->leaves
            ->with('user')
            ->where('status', 'pending')
            ->orderBy('start_date', 'desc')
            ->get();
    }
    public function getLeaveByIdAndYear(int $leaveId, int $year): ?Leaves
    {
        return $this->leaves
            ->where('id', $leaveId)
            ->whereYear('start_date', $year)
            ->first();
    }

    /**
     * Zatwierdź urlop i zaktualizuj saldo
     */
    public function approveLeave(int $leaveId, int $approvedBy, ?string $description = null, array $meta = []): bool
    {
        // Implementacja zatwierdzania może być dodana tutaj w przyszłości.
        $leavesByIdAndYear = $this->getLeaveByIdAndYear($leaveId, now()->year);

        // Jeśli potrzebne — logujemy przywołanie approveLeave dla śledzenia
        \Log::info('approveLeave called', [
            'leave_id' => $leaveId,
            'approved_by' => $approvedBy,
            'description' => $description,
            'meta' => $meta,
            'found_leave' => $leavesByIdAndYear ? true : false,
        ]);

        // Tymczasowo nie implementujemy pełnej logiki (używamy setLeaveBalance z kontrolera)
        return false;
    }

    /**
     * Odrzuć urlop
     */
    public function rejectLeave(int $leaveId, int $rejectedBy, string $rejectionReason, array $meta = []): bool
    {
        $leave = $this->leaves->find($leaveId);
        if (!$leave || $leave->status !== 'pending') {
            return false;
        }

        $rejectionReason = trim((string) $rejectionReason);
        if ($rejectionReason === '') {
            $rejectionReason = 'Brak dni do wykorzystania';
        }

        $update = [
            'status' => 'rejected',
            'approved_by' => $rejectedBy ?: Auth::id(),
            'approved_at' => now(),
            'rejection_reason' => $rejectionReason,
        ];

        if (isset($meta['days'])) {
            $update['days'] = (int) $meta['days'];
        }
        if (isset($meta['type'])) {
            $update['type'] = $meta['type'];
        }
        if (isset($meta['user_id'])) {
            $update['user_id'] = (int) $meta['user_id'];
        }

        $leave->fill($update);
        $saved = (bool) $leave->save();
        if (!$saved) {
            throw new \Exception('Nie udało się odrzucić urlopu.');
        }

        return true;
    }

    /**
     * Pobierz oczekujące urlopy dla konkretnego użytkownika
     */
    public function getUserPendingLeaves(int $userId): Collection
    {
        return $this->leaves
            ->where('user_id', $userId)
            ->where('status', 'pending')
            ->orderBy('start_date', 'desc')
            ->get();
    }

    /**
     * Pobierz użyte urlopy konkretnego użytkownika
     */
    public function getUsedLeavesByUser(int $userId): Collection
    {
        $today = Carbon::today();

        return $this->leaves
            ->where('user_id', $userId)
            ->where('status', 'approved')
            ->where('start_date', '<', $today)
            ->orderBy('start_date', 'desc')
            ->get();
    }

    public function setLeaveBalance(int $leaveId, int $day, int $userId, string $description): LeaveBalance
    {
        $leave = $this->leaves->find($leaveId);

        if (!$leave) {
            throw new \Exception("Leave request not found");
        }

        $year = Carbon::parse($leave->start_date)->year;

        $leaveBalance = $this->leaveBalance->where('user_id', $leave->user_id)
            ->where('year', $year)
            ->first();

        if (!$leaveBalance) {
            throw new \Exception("Leave balance not found for year: {$year}");
        }

        \Log::info('setLeaveBalance - raw data from DB', [
            'leave_id' => $leaveId,
            'leave_balance_id' => $leaveBalance->id,
            'raw_leave_type' => $leaveBalance->raw_type,
            'attributes' => $leaveBalance->attributes,
        ]);

        $typeEnum = $leaveBalance->type_enum;

        if (!$typeEnum) {
            \Log::error('setLeaveBalance - unknown leave type', [
                'leave_id' => $leaveId,
                'leave_balance_id' => $leaveBalance->id,
                'raw_type' => $leaveBalance->raw_type,
                'all_attributes' => $leaveBalance->attributes,
            ]);
            throw new \Exception("Nieznany typ urlopu: {$leaveBalance->raw_type}");
        }

        \Log::info('setLeaveBalance - checking balance', [
            'leave_id' => $leaveId,
            'user_id' => $leave->user_id,
            'year' => $year,
            'requested_days' => $day,
            'balance_remaining' => $leaveBalance->remaining_days,
            'balance_used' => $leaveBalance->used_days,
            'balance_type' => $typeEnum->value,
        ]);

        if (($typeEnum === LeavesType::ANNUAL || $typeEnum === LeavesType::ON_DEMAND) && $leaveBalance->remaining_days < $day) {
            $leave->status = 'rejected';
            $leave->approved_by = Auth::id();
            $leave->approved_at = now();
            $leave->rejection_reason = "Niewystarczające saldo urlopu.";
            $leave->save();

            throw new \Exception('Urlop odrzucony: Niewystarczające saldo urlopu.');
        }

        if ($typeEnum === LeavesType::ANNUAL) {
            $leaveBalance->used_days += $day;
            $leaveBalance->remaining_days -= $day;
            $leaveBalance->save();

            \Log::info('setLeaveBalance - saving ANNUAL leave', [
                'leave_id' => $leave->id,
                'justification_param' => $description,
                'justification_length' => strlen($description),
            ]);

            $leave->status = 'approved';
            $leave->approved_by = Auth::id();
            $leave->approved_at = now();
            $leave->rejection_reason = $description;
            $leave->save();

            \Log::info('setLeaveBalance - ANNUAL saved', [
                'leave_id' => $leave->id,
                'rejection_reason_in_model' => $leave->rejection_reason,
            ]);

        } elseif (in_array($typeEnum, [LeavesType::SICK, LeavesType::UNPAID, LeavesType::PARENTAL, LeavesType::COMPASSIONATE], true)) {

            $leave->status = 'approved';
            $leave->approved_by = Auth::id();
            $leave->approved_at = now();
            $leave->rejection_reason = $description;
            $leave->save();

        } elseif ($typeEnum === LeavesType::ON_DEMAND) {

            if ($day > 2) {
                $leave->status = 'rejected';
                $leave->approved_by = Auth::id();
                $leave->approved_at = now();
                $leave->rejection_reason = "Urlop na żądanie nie może przekraczać 2 dni.";
                $leave->save();

                throw new \Exception('Urlop odrzucony: Urlop na żądanie nie może przekraczać 2 dni.');
            }

            if ($leaveBalance->remaining_days < $day) {
                $leave->status = 'rejected';
                $leave->approved_by = Auth::id();
                $leave->approved_at = now();
                $leave->rejection_reason = "Niewystarczające saldo urlopu na żądanie.";
                $leave->save();

                throw new \Exception('Urlop odrzucony: Niewystarczające saldo urlopu na żądanie.');
            }

            $leaveBalance->used_days += $day;
            $leaveBalance->remaining_days -= $day;
            $leaveBalance->request_used = ($leaveBalance->request_used ?? 0) + $day;
            $leaveBalance->save();

            $leave->status = 'approved';
            $leave->approved_by = Auth::id();
            $leave->approved_at = now();
            $leave->rejection_reason = $description;
            $leave->save();

        } else {
            throw new \Exception('Nieznany typ urlopu.');
        }

        return $leaveBalance;
    }
}


