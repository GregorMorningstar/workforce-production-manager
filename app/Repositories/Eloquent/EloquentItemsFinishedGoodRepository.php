<?php

namespace App\Repositories\Eloquent;

use App\Models\ItemsFinishedGood;
use App\Repositories\Contracts\ItemsFinishedGoodRepositoryInterface;

class EloquentItemsFinishedGoodRepository implements ItemsFinishedGoodRepositoryInterface
{
    public function __construct(private readonly ItemsFinishedGood $model)
    {
    }

    public function paginate(int $perPage = 15, array $filters = [])
    {
        $query = $this->model->newQuery();

        if (!empty($filters['search'] ?? null)) {
            $q = $filters['search'];
            $query->where('name', 'like', "%{$q}%");
        }

        return $query->orderBy('id', 'desc')->paginate($perPage);
    }

    public function getWithProcessSummaryPaginated(int $perPage = 15, array $filters = [])
    {
        $query = $this->model->newQuery()
            ->join('production_schemas', 'production_schemas.items_finished_good_id', '=', 'items_finished_goods.id')
            ->join('production_schema_steps', 'production_schema_steps.production_schema_id', '=', 'production_schemas.id')
            ->select(
                'items_finished_goods.id',
                'items_finished_goods.name',
                'items_finished_goods.barcode',
                'items_finished_goods.time_of_production',
                'items_finished_goods.price',
                \DB::raw('COUNT(production_schema_steps.id) as steps_count')
            )
            ->groupBy(
                'items_finished_goods.id',
                'items_finished_goods.name',
                'items_finished_goods.barcode',
                'items_finished_goods.time_of_production',
                'items_finished_goods.price'
            );

        if (!empty($filters['name'] ?? null)) {
            $query->where('items_finished_goods.name', 'like', '%'.$filters['name'].'%');
        }

        if (!empty($filters['barcode'] ?? null)) {
            $query->where('items_finished_goods.barcode', 'like', '%'.$filters['barcode'].'%');
        }

        return $query->orderBy('items_finished_goods.id', 'desc')->paginate($perPage);
    }

    public function find(int $id)
    {
            return $this->model->with('productionSchema')->find($id);
    }

    public function create(array $data)
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data)
    {
        $item = $this->model->find($id);
        if (!$item) {
            return null;
        }
        $item->fill($data);
        $item->save();
        return $item;
    }

    public function delete(int $id): bool
    {
        $item = $this->model->find($id);
        if (!$item) {
            return false;
        }
        return (bool) $item->delete();
    }
}
