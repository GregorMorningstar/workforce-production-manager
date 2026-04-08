<?php


namespace App\Services\Contracts;



interface MachineFailureServiceInterface
{
public function createMachineFailure(array $data, int $machineId);
public function getAllFailuresWithMachines(): array;
public function findFailureById(int $id);
public function updateMachineFailure(int $id, array $data): bool;
public function deleteMachineFailure(int $id): bool;
public function setZeroFailureCount(int $machineId): bool;
public function getFailureHistory(array $filters = [], int $perPage = 15): array;
	public function getRepairedHistory(array $filters = [], int $perPage = 15, ?string $userRole = null, ?int $userId = null): array;
public function getLatestFailureByMachineBarcode(string $barcode);
}
