<?php

namespace App\Services;

use App\Services\Contracts\LeavesServiceInterface;
use App\Repositories\Contracts\LeavesRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use App\Models\LeaveBalance;

class LeavesService implements LeavesServiceInterface
{
    public function __construct(private readonly LeavesRepositoryInterface $leavesRepository,
    private readonly LeaveBalance $leaveBalance)
    {
    }

    public function getAllLeavesByUserId(int $userId)
    {
        return $this->leavesRepository->getAllLeavesByUserId($userId);
    }

    public function store(array $data)
    {
        return $this->leavesRepository->store($data);
    }

    public function getLeavesById(int $id): ?\App\Models\Leaves
    {
        return $this->leavesRepository->getLeavesById($id);
    }

    public function updateLeave(int $id, array $data)
    {
        return $this->leavesRepository->updateLeave($id, $data);
    }

    public function deleteLeave(int $id): bool
    {
        return $this->leavesRepository->deleteLeave($id);
    }

    public function getAllLeaves()
    {
        return $this->leavesRepository->getAllLeaves();
    }

    /**
     * Pobierz urlopy w przedziale dat dla kalendarza
     */
    public function getCalendarLeaves(?string $startDate = null, ?string $endDate = null)
    {
        $start = $startDate ? Carbon::parse($startDate) : Carbon::now()->startOfMonth();
        $end = $endDate ? Carbon::parse($endDate) : Carbon::now()->endOfMonth();

        return $this->leavesRepository->getLeavesInDateRange($start, $end);
    }

    /**
     * Pobierz statystyki urlopów dla dashboardu
     */
    public function getLeavesStatistics(): array
    {
        return $this->leavesRepository->getLeavesStatistics();
    }

    /**
     * Pobierz aktywne urlopy
     */
    public function getActiveLeaves()
    {
        return $this->leavesRepository->getActiveLeaves();
    }

    /**
     * Pobierz urlopy według statusu
     */
    public function getLeavesByStatus(string $status)
    {
        return $this->leavesRepository->getLeavesByStatus($status);
    }

    /**
     * Pobierz wszystkie oczekujące urlopy
     */
    public function getPendingLeaves(): Collection
    {
        return $this->leavesRepository->getPendingLeaves();
    }

    /**
     * Zatwierdź urlop
     */
    public function approveLeave(int $leaveId, int $approvedBy, string $description = null, array $meta = []): bool
    {
        return $this->leavesRepository->approveLeave($leaveId, $approvedBy, $description, $meta);
    }

    /**
     * Odrzuć urlop
     */
    public function rejectLeave(int $leaveId, int $rejectedBy, string $rejectionReason, array $meta = []): bool
    {
        return $this->leavesRepository->rejectLeave($leaveId, $rejectedBy, $rejectionReason, $meta);
    }

    /**
     * Pobierz oczekujące urlopy użytkownika
     */
    public function getUserPendingLeaves(int $userId): Collection
    {
        return $this->leavesRepository->getUserPendingLeaves($userId);
    }

    /**
     * Pobierz użyte urlopy konkretnego użytkownika
     *
     * @param int $userId
     */    public function getUsedLeavesByUser(int $userId): Collection
    {
        return $this->leavesRepository->getUsedLeavesByUser($userId);
    }

    public function setLeaveBalance(int $leaveId, int $day, int $userId, string $description): LeaveBalance
    {
        return $this->leavesRepository->setLeaveBalance($leaveId, $day, $userId, $description);
    }
}
