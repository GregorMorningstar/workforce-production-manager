<?php

namespace App\Repositories\Eloquent;

use App\Repositories\Contracts\DepartmentsRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use App\Models\Department;

class EloquentDepartmentsRepository implements DepartmentsRepositoryInterface
{
    protected Department $model;

    public function __construct(Department $model)
    {
        $this->model = $model;
    }

    public function getAllWithUsersPaginated(int $perPage): LengthAwarePaginator
    {
        return $this->model
            ->with('users')
            ->withCount([
                'machines as count_of_machine',
                'machines as count_of_employee' => function ($query) {
                    $query->select(DB::raw('COUNT(DISTINCT user_id)'))
                        ->whereNotNull('user_id');
                },
                'machineFailures as count_of_failure_machine' => function ($query) {
                    $query->whereNull('finished_repaired_at');
                },
            ])
            ->paginate($perPage);
    }

    public function create(array $data): Department
    {
        return $this->model->create($data);
    }

    public function existsByName(string $name): bool
    {
        return $this->model->where('name', $name)->exists();
    }

    public function findById(int $id): ?Department
    {
        return $this->model->find($id);
    }

    public function update(int $id, array $data): Department
    {
        $department = $this->model->findOrFail($id);
        $department->fill($data);
        $department->save();
        return $department;
    }

    public function delete(int $id): bool
    {
        $department = $this->model->find($id);
        if (!$department) return false;
        return (bool) $department->delete();
    }

    public function findByIdWithUsersAndMachines(int $id): ?Department
    {
        return $this->model
            ->with(['users', 'machines.owner'])
            ->withCount([
                'machines as count_of_machine',
                'machines as count_of_employee' => function ($query) {
                    $query->select(DB::raw('COUNT(DISTINCT user_id)'))
                        ->whereNotNull('user_id');
                },
                'machineFailures as count_of_failure_machine' => function ($query) {
                    $query->whereNull('finished_repaired_at');
                },
            ])
            ->find($id);
    }

    public function updateHallLayout(int $id, array $layout): bool
    {
        $department = $this->model->find($id);
        if (!$department) {
            return false;
        }

        $department->hall_layout = $layout;
        return (bool) $department->save();
    }
}
