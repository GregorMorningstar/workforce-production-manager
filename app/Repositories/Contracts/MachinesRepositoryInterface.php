<?php

namespace App\Repositories\Contracts;


use App\Models\Machines;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface MachinesRepositoryInterface
{
    public function findById(int $id): ?Machines;
    public function findAll(int $perPage = 15): LengthAwarePaginator;
    public function create(array $data): Machines;
    public function update(int $id, array $data): ?Machines;
    public function delete(int $id): bool;
    public function hasUserAssignedMachines(int $userId): bool;
    public function getAllmachinesWithOperators(): LengthAwarePaginator;
    public function setLastFailureDate(int $machineId): bool;
    public function updateStatus(int $machineId, string $status): bool;
    public function getUserMachines(int $userId, int $perPage = 15): LengthAwarePaginator;
}
