<?php


namespace App\Services\Contracts;


interface OperationMachineServiceInterface
{
public function createOperation(int $machineId, int $operationId, array $data);
public function getAllOperationsWithMachines();
public function updateOperation(int $operationId, array $data): bool;
public function deleteOperation(int $operationId): bool;
}
