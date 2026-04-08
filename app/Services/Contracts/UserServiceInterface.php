<?php

namespace App\Services\Contracts;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface UserServiceInterface
{
    public function getById(int $id): ?User;
    public function getAll(int $perPage = 15): LengthAwarePaginator;
    public function getAllByRole(int $perPage = 15, ?string $role = null, array $filters = []): LengthAwarePaginator;
    public function getEmployeeDetailsWithRelations(int $employeeId): ?User;
    public function getAnnualLeaveDays(int $userId): ?User;
    // Profile methods
    public function createUserProfile(User $user, array $data): UserProfile;
    public function updateUserProfile(User $user, array $data): UserProfile;
    public function getUserProfile(User $user): ?UserProfile;
    public function deleteUserProfile(User $user): bool;
    public function deleteProfilePhoto(User $user): bool;
    public function getAllCertificatesWithPendingStatus(array $filters): ?\Illuminate\Contracts\Pagination\LengthAwarePaginator;
    public function setWorkedMonths(int $userId, int $months): ?User;
    }
