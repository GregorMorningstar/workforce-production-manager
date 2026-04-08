<?php

namespace App\Services;

use App\Services\Contracts\MachinesServiceInterface;
use App\Repositories\Contracts\MachinesRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Models\Machines;
use InvalidArgumentException;
use Illuminate\Support\Facades\Schema;

use App\Enums\MachineStatus;
class MachineService implements MachinesServiceInterface
{
    protected MachinesRepositoryInterface $machinesRepository;

    public function __construct(MachinesRepositoryInterface $machinesRepository)
    {
        $this->machinesRepository = $machinesRepository;
    }

    public function getAllMachines(int $perPage): LengthAwarePaginator
    {
        $machines = $this->machinesRepository->findAll($perPage);

        if ($machines instanceof LengthAwarePaginator) {
            $collection = $machines->getCollection();

            $relations = [];
            if (Schema::hasTable('departments')) {
                $relations[] = 'department';
            }
            if (Schema::hasTable('users')) {
                $relations[] = 'owner';
            }
            if (Schema::hasTable('machine_user') && Schema::hasTable('users')) {
                $relations[] = 'users';
            }

            if (!empty($relations)) {
                $collection = $collection->load(array_unique($relations));
            }

            $machines->setCollection($collection);
        }

        return $machines;
    }

    public function getMachineById(int $id): Machines
    {
        $machine = $this->machinesRepository->findById($id);
        if (!$machine) {
            throw new \Exception("Nie znaleziono maszyny");
        }
        return $machine;
    }

    public function findById(int $id): ?Machines
    {
        return $this->machinesRepository->findById($id);
    }

    public function createMachine(array $data): Machines
    {
        return $this->machinesRepository->create($data);
    }

    public function updateMachine(int $id, array $data): Machines
    {
        $machine = $this->machinesRepository->update($id, $data);
        if (!$machine) {
            throw new \Exception("Nie znaleziono maszyny do aktualizacji");
        }
        return $machine;
    }

    public function deleteMachine(int $id): bool
    {

        if ($this->machinesRepository->hasAssignedUsers($id)) {
            throw new InvalidArgumentException('Maszyna ma przypisanych użytkowników. Najpierw odłącz użytkowników.');
        }

        return $this->machinesRepository->delete($id);
    }

    public function getAllmachinesWithOperators(): LengthAwarePaginator
    {
        return $this->machinesRepository->getAllmachinesWithOperators();
    }

    public function setLastFailureDate(int $machineId): bool
    {
        return $this->machinesRepository->setLastFailureDate($machineId);
    }
    public function updateStatus(int $machineId, string $status): bool
    {
        return $this->machinesRepository->updateStatus($machineId, $status);
    }

    public function getUserMachines(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->machinesRepository->getUserMachines($userId, $perPage);
    }
}
