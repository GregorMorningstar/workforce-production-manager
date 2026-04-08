<?php

namespace App\Repositories\Eloquent;

use App\Models\Machines;
use App\Repositories\Contracts\MachinesRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Enums\MachineStatus;

class EloquentMachinesRepository implements MachinesRepositoryInterface
{
    private readonly Machines $model;

    public function __construct(Machines $model)
    {
        $this->model = $model;
    }

    public function findById(int $id): ?Machines
    {
        return $this->model->find($id);
    }

    public function findAll(int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->paginate($perPage);
    }

    public function create(array $data): Machines
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): Machines
    {
        $machine = $this->model->findOrFail($id);
        $machine->update($data);
        return $machine;
    }

    public function updateStatus(int $machineId, string $status): bool
    {
        $machine = $this->model->find($machineId);
        if (!$machine) {
            return false;
        }
        $machine->status = $status;
        return (bool) $machine->save();
    }

    public function delete(int $id): bool
    {
        $machine = $this->model->find($id);
        if (!$machine) {
            return false;
        }
        return (bool) $machine->delete();
    }

    public function hasUserAssignedMachines(int $userId): bool
    {
        return $this->model->where('user_id', $userId)->exists();
    }

    public function getAllmachinesWithOperators(): LengthAwarePaginator
    {
        return $this->model->with('operator')->paginate(15);
    }

    public function setLastFailureDate(int $machineId): bool
    {
        $machine = $this->model->find($machineId);
        if (!$machine) {
            return false;
        }

        $machine->last_failure_date = now();
        $machine->status = MachineStatus::BREAKDOWN;
        return $machine->save();
    }

    public function getUserMachines(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->where('user_id', $userId)->with('operator','operations','machineFailures','department')->paginate($perPage);
    }
}
