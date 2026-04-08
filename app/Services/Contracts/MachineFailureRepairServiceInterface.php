<?php

namespace App\Services\Contracts;
use App\Models\MachineFailureRepair;
use App\Models\MachineFailure;
use Illuminate\Support\Collection;

interface MachineFailureRepairServiceInterface
{
    public function getFailuresWithMachine(int $machineId): ?MachineFailure;
    public function create(array $data): MachineFailureRepair;
    public function update(int $id, array $data): bool;
    public function delete(int $id): bool;
    public function getFailureMachineWithMachine(int $machineId): ?MachineFailure;
    public function getFailuresByBarcode(string $barcode): Collection;
    public function getFailuresByBarcodePaginated(string $barcode, int $perPage = 5, array $filters = []);
    public function addAllRepairsCosts(int $machineFailureId, ?string $repairOrderNo = null): float;
}
