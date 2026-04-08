<?php



namespace App\Repositories\Contracts;
use App\Models\MachineFailure;

interface MachineFailureRepositoryInterface
{
    public function create(array $data): MachineFailure;
    public function getAllFailuresWithMachines(): array;
    public function findById(int $id): ?MachineFailure;
    public function update(int $id, array $data): bool;
    public function delete(int $id): bool;
    public function addAllRepairsCosts(int $machine_failure_id, ?string $repairOrderNo = null): float;
    public function finishRaportedFailure(int $id, array $data): bool;
    public function getFailureHistory(array $filters = [], int $perPage = 15): array;
    public function getLatestFailureByMachineBarcode(string $barcode);

}
