<?php

namespace App\Repositories\Contracts;

use Illuminate\Support\Collection;
use App\Models\Department;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface DepartmentsRepositoryInterface
{
//    get all departments with user relations and paginate
    public function getAllWithUsersPaginated(int $perPage): LengthAwarePaginator;
    public function create(array $data): Department;
    public function existsByName(string $name): bool;
    public function findById(int $id): ?Department;
    public function findByIdWithUsersAndMachines(int $id): ?Department;
    public function updateHallLayout(int $id, array $layout): bool;
    public function update(int $id, array $data): Department;
    public function delete(int $id): bool;
}
