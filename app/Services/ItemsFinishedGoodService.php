<?php

namespace App\Services;

use App\Services\Contracts\ItemsFinishedGoodServiceInterface;
use App\Repositories\Contracts\ItemsFinishedGoodRepositoryInterface;

class ItemsFinishedGoodService implements ItemsFinishedGoodServiceInterface
{
    public function __construct(private readonly ItemsFinishedGoodRepositoryInterface $repository)
    {
    }

    public function paginate(int $perPage = 15, array $filters = [])
    {
        return $this->repository->paginate($perPage, $filters);
    }

    public function getWithProcessSummaryPaginated(int $perPage = 15, array $filters = [])
    {
        return $this->repository->getWithProcessSummaryPaginated($perPage, $filters);
    }

    public function find(int $id)
    {
        return $this->repository->find($id);
    }

    public function create(array $data)
    {
        $item = $this->repository->create($data);

        if ($item) {
            // create a default production schema split into three steps
            $total = (int) ($item->time_of_production ?? 60);
            $part = intdiv(max($total, 3), 3);
            $steps = [
                ['name' => 'Przygotowanie', 'duration' => $part],
                ['name' => 'Obróbka', 'duration' => $part],
                ['name' => 'Montaż i kontrola', 'duration' => max(1, $total - 2 * $part)],
            ];

            try {
                \App\Models\ProductionSchema::create([
                    'items_finished_good_id' => $item->id,
                    'name' => 'Domyślny schemat',
                ]);
            } catch (\Throwable $e) {
                // swallow - schema creation is best-effort
            }
        }

        return $item;
    }

    public function update(int $id, array $data)
    {
        return $this->repository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }
}
