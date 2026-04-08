<?php

namespace App\Services\Contracts;
use App\Models\Leaves;
use Illuminate\Database\Eloquent\Collection;
use Carbon\Carbon;
use App\Models\LeaveBalance;

interface LeavesServiceInterface
{
    public function getAllLeavesByUserId(int $userId);
    public function store(array $data);
    public function getLeavesById(int $id): ? Leaves ;
    public function updateLeave(int $id, array $data);
    public function deleteLeave(int $id): bool;
    public function getAllLeaves();
    /**
     * Zatwierdź urlop
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
     * Pobierz oczekujące urlopy użytkownika
     */
    public function getUserPendingLeaves(int $userId): Collection;

    /**
     * Pobierz urlopy w przedziale dat dla kalendarza
     */
    public function getCalendarLeaves(?string $startDate = null, ?string $endDate = null);

    /**
     * Pobierz statystyki urlopów dla dashboardu
     */
    public function getLeavesStatistics(): array;

    /**
     * Pobierz aktywne urlopy
     */
    public function getActiveLeaves();

    /**
     * Pobierz urlopy według statusu
     */
    public function getLeavesByStatus(string $status);

    /**
     * Pobierz wszystkie oczekujące urlopy
     */
    public function getPendingLeaves(): Collection;

    /**
     * Pobierz użyte urlopy konkretnego użytkownika
     *
     * @param int $userId
     */    public function getUsedLeavesByUser(int $userId): Collection;

    public function setLeaveBalance(int $leaveId, int $day,int $userId, string $description): LeaveBalance;
}
