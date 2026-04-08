<?php

namespace App\Services\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Models\Department;
interface DepartmentServiceInterface
{
    /**
     * Zwraca paginowane wydziały wraz z relacją users.
     */
    public function getAllDepartmentsWithUsersPaginated(int $perPage): LengthAwarePaginator;
    public function existsByName(string $name): bool;
    public function createDepartment(array $data): Department;
    public function getById(int $id): ?Department;
    public function updateDepartment(int $id, array $data): Department;
    public function deleteDepartment(int $id): bool;
    public function getByIdWithUsersAndMachines(int $id): ?Department;
    public function saveHallLayout(int $id, array $layout): bool;
}
