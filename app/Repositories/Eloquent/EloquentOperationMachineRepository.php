<?php

namespace App\Repositories\Eloquent;

use App\Repositories\Contracts\OperationMachineRepositoryInterface;
use App\Models\Operationmachine;
use Illuminate\Database\Eloquent\Collection;

class EloquentOperationMachineRepository implements OperationMachineRepositoryInterface
{
    public function __construct(public readonly Operationmachine $operationmachine)
    {
    }

    public function create(array $data): Operationmachine
    {
      return $this->operationmachine->create($data);
    }

    public function getAllOperationsByMachineId(int $machineId): Collection
    {
        return $this->operationmachine->where('machine_id', $machineId)->with('machine')->get();
    }

    public function getAll(): Collection
    {
        return $this->operationmachine->with('machine')->get();
    }

    public function findById(int $id)
    {
        return $this->operationmachine->with('machine')->find($id);
    }

    public function updateById(int $id, array $data): bool
    {
        $row = $this->operationmachine->find($id);
        if (!$row) return false;
        return (bool) $row->update($data);
    }

    public function deleteById(int $id): bool
    {
        $row = $this->operationmachine->find($id);
        if (!$row) return false;
        return (bool) $row->delete();
    }
    public function update(int $id, array $data): bool
    {
        $row = $this->operationmachine->find($id);
     //   dd($row);
        if (!$row) {
            return false;
        }
        return (bool) $row->update($data);
    }

    public function getOperationsWithMachinesId()
    {
        return $this->operationmachine->with('machine','department')->get();
    }
}
