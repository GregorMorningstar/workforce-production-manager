<?php

namespace App\Repositories\Contracts;
use App\Models\Leaves;
use Illuminate\Database\Eloquent\Collection;
use Carbon\Carbon;
use App\Models\LeaveBalance;

interface LeavesRepositoryInterface
{
    public function getAllLeavesByUserId(int $userId);
    public function store(array $data);
    public function getLeavesById(int $id): ? Leaves ;
    public function updateLeave(int $id, array $data);
    public function deleteLeave(int $id): bool;
    public function getAllLeaves();
    /**
     * Zatwierdź urlop i zaktualizuj saldo
     *
     * @param array $meta dodatkowe dane: days, type, user_id, year
     */
    public function approveLeave(int $leaveId, int $approvedBy, string $description = null, array $meta = []): bool;

    /**
     * Odrzuć urlop
     *
     * @param array $meta dodatkowe dane: days, type, user_id, year
     */
    public function rejectLeave(int $leaveId, int $rejectedBy, string $rejectionReason, array $meta = []): bool;

    /**
     * Pobierz oczekujące urlopy dla konkretnego użytkownika
     */
    public function getUserPendingLeaves(int $userId): Collection;

    /**
     * Pobierz wszystkie urlopy w określonym przedziale dat
     */
    public function getLeavesInDateRange(Carbon $startDate, Carbon $endDate): Collection;

    /**
     * Pobierz urlopy dla konkretnego użytkownika w przedziale dat
     */
    public function getUserLeaves(int $userId, ?Carbon $startDate = null, ?Carbon $endDate = null): Collection;

    /**
     * Pobierz wszystkie aktywne urlopy
     */
    public function getActiveLeaves(): Collection;

    /**
     * Pobierz urlopy według statusu
     */
    public function getLeavesByStatus(string $status): Collection;

    /**
     * Pobierz statystyki urlopów
     */
    public function getLeavesStatistics(): array;

    /**
     * Pobierz wszystkie oczekujące urlopy
     */
    public function getPendingLeaves(): Collection;

    /**
     * Pobierz urlop po id i roku
     */

    public function getLeaveByIdAndYear(int $leaveId, int $year): ?Leaves;

    /**
     * Pobierz użyte urlopy konkretnego użytkownika
     *
     * @param int $userId
     */
    public function getUsedLeavesByUser(int $userId): Collection;

    public function setLeaveBalance(int $leaveId, int $day,int $userId, string $description): LeaveBalance;

    }
