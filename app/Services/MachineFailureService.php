<?php


namespace App\Services;

use App\Services\Contracts\MachineFailureServiceInterface;
use App\Repositories\Contracts\MachineFailureRepositoryInterface;
use App\Services\Contracts\MachinesServiceInterface;

class MachineFailureService implements MachineFailureServiceInterface
{
    public function __construct(private readonly MachineFailureRepositoryInterface $machineFailureRepository,
                                private readonly MachinesServiceInterface $machinesService)
    {
    }

    public function createMachineFailure(array $data, int $machineId)
    {

        $this->machinesService->setLastFailureDate($machineId);
        return $this->machineFailureRepository->create($data);
    }
    public function getAllFailuresWithMachines(): array
    {
        return $this->machineFailureRepository->getAllFailuresWithMachines();
    }
    public function findFailureById(int $id)
    {
        return $this->machineFailureRepository->findById($id);
    }
    public function updateMachineFailure(int $id, array $data): bool
    {
        return $this->machineFailureRepository->update($id, $data);
    }
    public function deleteMachineFailure(int $id): bool
    {
        return $this->machineFailureRepository->delete($id);
    }
    public function setZeroFailureCount(int $machineId): bool
    {
        return $this->machineFailureRepository->setZeroFailureCount($machineId);
    }
    public function getFailureHistory(array $filters = [], int $perPage = 15): array
    {
        return $this->machineFailureRepository->getFailureHistory($filters, $perPage);
    }

    /**
     * Get paginated repaired failures history. Role and userId are optional for scoping.
     */
    public function getRepairedHistory(array $filters = [], int $perPage = 15, ?string $userRole = null, ?int $userId = null): array
    {
        return $this->machineFailureRepository->getRepairedHistory($filters, $perPage, $userRole, $userId);
    }

    public function getLatestFailureByMachineBarcode(string $barcode)
    {
        return $this->machineFailureRepository->getLatestFailureByMachineBarcode($barcode);
    }

}
