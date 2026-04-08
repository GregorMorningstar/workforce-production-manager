<?php

namespace App\Repositories\Eloquent;

use App\Models\ProductionSchema;
use App\Repositories\Contracts\ProductionSchemaRepositoryInterface;

class EloquentProductionSchemaRepository implements ProductionSchemaRepositoryInterface
{
    public function __construct(private readonly ProductionSchema $model)
    {
    }

    public function find(int $id)
    {
        return $this->model->find($id);
    }

    public function findByItem(int $itemId)
    {
        return $this->model
            ->with([
                'steps' => function ($query) {
                    $query->orderBy('step_number');
                },
                'steps.machine:id,name,serial_number,model,status',
                'steps.operation:id,operation_name,changeover_time',
                'steps.operation.productionMaterial:id,name,material_form',
                'steps.operation.materials:id,name,material_form',
                'steps.material:id,name,material_form',
                'item'
            ])
            ->where('items_finished_good_id', $itemId)
            ->first();
    }

    public function create(array $data)
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data)
    {
        $schema = $this->model->find($id);
        if (!$schema) {
            return null;
        }
        $schema->fill($data);
        $schema->save();
        return $schema;
    }

    public function delete(int $id): bool
    {
        $schema = $this->model->find($id);
        if (!$schema) {
            return false;
        }
        return (bool) $schema->delete();
    }

    public function paginate(int $perPage = 10, array $with = [])
    {
        $query = $this->model->with(array_merge([
            'item',
            'steps',
            'steps.machine',
            'steps.operation',
            'steps.material'
        ], $with))->orderBy('id', 'desc');

        return $query->paginate($perPage);
    }
}
