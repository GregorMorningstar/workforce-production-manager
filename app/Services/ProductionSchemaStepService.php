<?php

namespace App\Services;

use App\Services\Contracts\ProductionSchemaStepServiceInterface;
use App\Repositories\Contracts\ProductionSchemaStepRepositoryInterface;
use App\Repositories\Contracts\ItemsFinishedGoodRepositoryInterface;
use App\Models\ProductionSchema;
use Illuminate\Support\Facades\Log;

class ProductionSchemaStepService implements ProductionSchemaStepServiceInterface
{
    public function __construct(
        private readonly ProductionSchemaStepRepositoryInterface $repository,
        private readonly ItemsFinishedGoodRepositoryInterface $itemsRepository
    ) {
    }

    public function find(int $id)
    {
        return $this->repository->find($id);
    }

    public function findBySchema(int $schemaId)
    {
        return $this->repository->findBySchema($schemaId);
    }

    public function create(array $data)
    {
        $step = $this->repository->create($data);
        if ($step) {
            $this->recalculateItemProductionTime($step->production_schema_id);
        }
        return $step;
    }

    public function update(int $id, array $data)
    {
        $step = $this->repository->update($id, $data);
        if ($step) {
            $this->recalculateItemProductionTime($step->production_schema_id);
        }
        return $step;
    }

    public function delete(int $id): bool
    {
        $step = $this->repository->find($id);
        if (!$step) return false;
        $schemaId = $step->production_schema_id;
        $deleted = $this->repository->delete($id);
        if ($deleted) {
            $this->recalculateItemProductionTime($schemaId);
        }
        return $deleted;
    }

    private function recalculateItemProductionTime(int $schemaId): void
    {
        $schema = ProductionSchema::with('steps', 'item')->find($schemaId);
        if (!$schema || !$schema->item) {
            return;
        }

        $totalSeconds = (int) $schema->steps->sum('production_time_seconds');

        // add changeover (przezbrojenie) time from distinct operationmachines used in steps
        $operationIds = $schema->steps->pluck('operationmachine_id')->filter()->unique()->values()->all();
        $changeoverSeconds = 0;
        if (!empty($operationIds)) {
            $ops = \App\Models\Operationmachine::whereIn('id', $operationIds)->get(['id', 'changeover_time']);
            foreach ($ops as $op) {
                // assume changeover_time is stored in minutes — convert to seconds
                $changeoverSeconds += (int) ($op->changeover_time * 60);
            }
        }

        $seconds = $totalSeconds + $changeoverSeconds;

        Log::info('Recalculating production time (seconds)', [
            'schema_id' => $schemaId,
            'steps_seconds' => $totalSeconds,
            'changeover_seconds' => $changeoverSeconds,
            'total_seconds' => $seconds,
        ]);

        // update item via repository to keep logic consistent (store seconds)
        $this->itemsRepository->update($schema->item->id, ['time_of_production' => $seconds]);
    }
}
