<?php

namespace App\Services;

use App\Services\Contracts\MachineFailureRepairServiceInterface;
use App\Repositories\Contracts\MachineFailureRepairRepositoryInterface;
use App\Models\MachineFailure;
use App\Models\MachineFailureRepair;
use Illuminate\Support\Collection;

class MachineFailureRepairService implements MachineFailureRepairServiceInterface
{
    public function __construct(private readonly MachineFailureRepairRepositoryInterface $repository)
    {
    }

    public function getFailuresWithMachine(int $machineId): ?MachineFailure
    {
        return $this->repository->getFailuresWithMachine($machineId);
    }
    public function create(array $data): MachineFailureRepair
    {
        return $this->repository->create($data);
    }
    public function update(int $id, array $data): bool
    {
        return $this->repository->update($id, $data);
    }
    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }
    public function getFailureMachineWithMachine(int $machineId): ?MachineFailure
    {
        return $this->repository->getFailureMachineWithMachine($machineId);
    }
    public function getFailuresByBarcode(string $barcode): Collection
    {
        return $this->repository->getFailuresByBarcode($barcode);
    }
    public function getFailuresByBarcodePaginated(string $barcode, int $perPage = 5, array $filters = [])
    {
        return $this->repository->getFailuresByBarcodePaginated($barcode, $perPage, $filters);
    }
   public function addAllRepairsCosts(int $machineFailureId, ?string $repairOrderNo = null): float
    {
        return $this->repository->addAllRepairsCosts($machineFailureId, $repairOrderNo);
    }

}
