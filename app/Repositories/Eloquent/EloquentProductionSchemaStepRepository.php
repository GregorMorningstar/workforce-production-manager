<?php

namespace App\Repositories\Eloquent;

use App\Models\ProductionSchemaStep;
use App\Repositories\Contracts\ProductionSchemaStepRepositoryInterface;

class EloquentProductionSchemaStepRepository implements ProductionSchemaStepRepositoryInterface
{
    public function __construct(private readonly ProductionSchemaStep $model)
    {
    }

    public function find(int $id)
    {
        return $this->model->find($id);
    }

    public function findBySchema(int $schemaId)
    {
        return $this->model->where('production_schema_id', $schemaId)->orderBy('step_number')->get();
    }

    public function create(array $data)
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data)
    {
        $step = $this->model->find($id);
        if (!$step) return null;
        $step->fill($data);
        $step->save();
        return $step;
    }

    public function delete(int $id): bool
    {
        $step = $this->model->find($id);
        if (!$step) return false;
        return (bool) $step->delete();
    }
}
