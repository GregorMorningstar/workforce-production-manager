<?php

namespace App\Repositories\Eloquent;

use App\Repositories\Contracts\UserRepositoryInterface;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Models\LeaveBalance;
use Carbon\Carbon;

class EloquentUserRepository implements UserRepositoryInterface
{
    public function __construct(private readonly User $userModel) {}

    public function findById(int $id): ?User
    {
        return $this->userModel->with('profile')->find($id);
    }

    public function findAll(int $perPage = 15): LengthAwarePaginator
    {
        return $this->userModel->with('profile')->paginate($perPage);
    }

    public function findAllByRole(int $perPage = 15, ?string $role = null, array $filters = []): LengthAwarePaginator
    {
        $query = $this->userModel->newQuery()->with(['department', 'profile']);

        if ($role) {
            $query->where('role', $role);
        }

        // Filter by name
        if (!empty($filters['name'])) {
            $query->where('name', 'like', '%' . $filters['name'] . '%');
        }

        // Filter by department
        if (!empty($filters['department'])) {
            $query->whereHas('department', function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['department'] . '%');
            });
        }

        // Filter by barcode
        if (!empty($filters['barcode'])) {
            $query->where('barcode', 'like', '%' . $filters['barcode'] . '%');
        }

        return $query->paginate($perPage);
    }

    public function getEmployeeDetailsWithRelations(int $employeeId): ?User
    {
        return $this->userModel
            ->with(['machines', 'department', 'profile'])
            ->find($employeeId);
    }
    public function setWorkedMonths(int $userId, int $months): ?User
    {
        $user = $this->userModel->find($userId);
        if ($user) {
            $user->monthly_work_time_target = $months;
            $user->save();
            return $user;
        }
        return null;
    }

    public function setLevesBalance(int $userId, int $days): ?LeaveBalance
    {
        return $this->setLeavesBalance($userId, $days);
    }

    /**
     * Ustawia saldo urlopu dla użytkownika
     */
    public function setLeavesBalance(int $userId, int $days): ?LeaveBalance
    {
        $year = Carbon::now()->year;

        $leavesBalance = LeaveBalance::firstOrCreate(
            ['user_id' => $userId, 'year' => $year],
            ['entitlement_days' => 20, 'used_days' => 0, 'remaining_days' => 20]
        );

        $oldEntitlement = (int) $leavesBalance->entitlement_days;
        $newEntitlement = (int) $days;

        if ($newEntitlement > $oldEntitlement) {
            $diff = $newEntitlement - $oldEntitlement;
            $leavesBalance->remaining_days = (int) $leavesBalance->remaining_days + $diff;
        }

        $leavesBalance->entitlement_days = $newEntitlement;

        $maxRemaining = max(0, $newEntitlement - (int) $leavesBalance->used_days);
        $leavesBalance->remaining_days = min((int) $leavesBalance->remaining_days, $maxRemaining);

        $leavesBalance->save();
        return $leavesBalance;
    }


    public function getAnnualLeaveDays(int $userId): ?User
    {
        $user = $this->userModel
            ->select('id', 'monthly_work_time_target', 'monthly_education_time_target', 'created_at')
            ->with(['leaves_balance'])
            ->find($userId);

        if (! $user) {
            \Log::warning("getAnnualLeaveDays: User not found for id {$userId}");
            return null;
        }

        $year = Carbon::now()->year;
        $totalMonths = (int) ($user->monthly_work_time_target ?? 0) + (int) ($user->monthly_education_time_target ?? 0);

        // upewnij się, że saldo na bieżący rok istnieje
        $userLeaveBalance = LeaveBalance::firstOrCreate(
            ['user_id' => $user->id, 'year' => $year],
            ['entitlement_days' => 20, 'used_days' => 0, 'remaining_days' => 20, 'leave_type' => 'vacation']
        );

        if ($totalMonths > 120) {
            $old = (int) $userLeaveBalance->entitlement_days;
            if ($old !== 26) {
                $userLeaveBalance->entitlement_days = 26;
                $userLeaveBalance->remaining_days = (int) $userLeaveBalance->remaining_days + 6;

                $maxRemaining = max(0, (int) $userLeaveBalance->entitlement_days - (int) $userLeaveBalance->used_days);
                $userLeaveBalance->remaining_days = min((int) $userLeaveBalance->remaining_days, $maxRemaining);

                $userLeaveBalance->save();
                \Log::info("Zaktualizowano roczne dni urlopu do 26 dni dla user_id: {$userId}");
            } else {
                \Log::info("entitlement already 26 for user_id: {$userId}");
            }
        } else {
            \Log::info("getAnnualLeaveDays: User ID {$userId} totalMonths = {$totalMonths}, no change.");
        }

        return $user;
    }
}
