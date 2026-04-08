<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use App\Models\LeaveBalance;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface UserRepositoryInterface
{
    public function findById(int $id): ?User;
    public function findAll(int $perPage = 15): LengthAwarePaginator;
    public function findAllByRole(int $perPage = 15, ?string $role = null, array $filters = []): LengthAwarePaginator;
    public function getEmployeeDetailsWithRelations(int $employeeId): ?User;
    public function setWorkedMonths(int $userId, int $months): ?User;
    public function getAnnualLeaveDays(int $userId): ?User;
    public function setLevesBalance(int $userId, int $days): ?LeaveBalance;
}
