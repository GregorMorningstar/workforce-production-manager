<?php

namespace App\Repositories\Contracts;
use App\Models\MachineFailureRepair;
use App\Models\MachineFailure;
use Illuminate\Support\Collection;

interface MachineFailureRepairRepositoryInterface
{
	public function getFailuresWithMachine(int $machineId): ?MachineFailure;
    public function create(array $data): MachineFailureRepair;
    public function update(int $id, array $data): bool;
    public function delete(int $id): bool;
    public function getFailureMachineWithMachine(int $machineId): ?MachineFailure;
    public function getFailuresByBarcode(string $barcode): Collection;
    public function getFailuresByBarcodePaginated(string $barcode, int $perPage = 5, array $filters = []);
    public function addAllRepairsCosts(int $machine_failure_id, ?string $repairOrderNo = null): float;

}
