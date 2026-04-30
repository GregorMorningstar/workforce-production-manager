<?php

namespace App\Repositories\Eloquent;

use App\Models\Machines;
use App\Repositories\Contracts\MachinesRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Enums\MachineStatus;
use Illuminate\Support\Facades\DB;

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
        $productionMachineIds = DB::table('order_item_production_plans')
            ->where('assigned_user_id', $userId)
            ->whereNotNull('machine_id')
            ->distinct()
            ->pluck('machine_id');

        $failureMachineIds = DB::table('machine_failures')
            ->where('user_id', $userId)
            ->whereNotNull('machine_id')
            ->distinct()
            ->pluck('machine_id');

        $ids = $productionMachineIds
            ->merge($failureMachineIds)
            ->filter()
            ->unique()
            ->values();

        return $this->model->newQuery()
            ->whereIn('id', $ids)
            ->with([
                'operator',
                'operations',
                'department',
                'machineFailures' => fn ($q) => $q->where('user_id', $userId)->latest('reported_at'),
            ])
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function canUserReportFailureForMachine(int $userId, int $machineId): bool
    {
        $isAssignedInProduction = DB::table('order_item_production_plans')
            ->where('assigned_user_id', $userId)
            ->where('machine_id', $machineId)
            ->exists();

        if ($isAssignedInProduction) {
            return true;
        }

        $alreadyReportedByUser = DB::table('machine_failures')
            ->where('user_id', $userId)
            ->where('machine_id', $machineId)
            ->exists();

        return $alreadyReportedByUser;
    }
}
