<?php

namespace App\Services;

use App\Services\Contracts\OperationMachineServiceInterface;
use App\Repositories\Contracts\OperationMachineRepositoryInterface;

class OperationMachineService implements OperationMachineServiceInterface
{
    public function __construct(
        private readonly OperationMachineRepositoryInterface $operationMachineRepository
    ) {
    }

    public function createOperation(int $machineId, int $operationId, array $data)
    {
        try {
            \Log::info('OperationMachineService::createOperation called', [
                'machineId' => $machineId,
                'data' => $data
            ]);

            $createData = [
                'machine_id'        => $machineId,
                'operation_name'    => $data['operation_name'],
                'description'       => $data['description'] ?? null,
                'changeover_time'   => $data['changeover_time'] ?? null,
                // barcode generowany automatycznie w modelu
            ];
//dd($createData);
            \Log::info('Calling repository create with data', $createData);

            $result = $this->operationMachineRepository->create($createData);

            \Log::info('Repository create result', ['result' => $result ? $result->toArray() : null]);

            return $result;
        } catch (\Exception $e) {
            throw new \Exception("Nie udało się zapisać operacji: " . $e->getMessage());
        }
    }

    public function getAllOperationsWithMachines()
    {
        return $this->operationMachineRepository->getAll();
    }

    public function updateOperation(int $operationId, array $data): bool
    {
        try {
            \Log::info('OperationMachineService::updateOperation called', [
                'operationId' => $operationId,
                'data' => $data
            ]);

            $updateData = [
                'operation_name'    => $data['operation_name'],
                'description'       => $data['description'] ?? null,
                'changeover_time'   => $data['changeover_time'] ?? null,
            ];

            \Log::info('Calling repository update with data', $updateData);

            $result = $this->operationMachineRepository->update($operationId, $updateData);

            \Log::info('Repository update result', ['result' => $result]);

            return $result;
        } catch (\Exception $e) {
            throw new \Exception("Nie udało się zaktualizować operacji: " . $e->getMessage());
        }
    }

    public function findById(int $id)
    {
        return $this->operationMachineRepository->findById($id);
    }
    public function deleteOperation(int $operationId): bool
    {
        try {
            \Log::info('OperationMachineService::deleteOperation called', [
                'operationId' => $operationId
            ]);

            $result = $this->operationMachineRepository->deleteById($operationId);

            \Log::info('Repository delete result', ['result' => $result]);

            return $result;
        } catch (\Exception $e) {
            \Log::error('Delete operation error: ' . $e->getMessage());
            throw new \Exception("Nie udało się usunąć operacji: " . $e->getMessage());
        }
    }
    public function getOperationsWithMachinesByMachineId(int $machineId)
    {
        return $this->operationMachineRepository->getAllOperationsByMachineId($machineId);
    }
}
