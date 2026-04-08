<?php

namespace App\Repositories\Eloquent;

use App\Repositories\Contracts\ProductionMaterialRepositoryInterface;
use App\Models\ProductionMaterial;
use App\Models\ProductionMaterialTransaction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EloquentProductionMaterialRepository implements ProductionMaterialRepositoryInterface
{
    public function __construct(private readonly ProductionMaterial $model) {}

    public function create(array $data): ProductionMaterial
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): ?ProductionMaterial
    {
        $model = $this->model->find($id);

        if (! $model) {
            return null;
        }

        $model->update($data);

        return $model->refresh();
    }

    public function delete(int $id): bool
    {
        $model = $this->model->find($id);

        if (! $model) {
            return false;
        }

        return (bool) $model->delete();
    }

    public function findById(int $id): ?ProductionMaterial
    {
        return $this->model->find($id);
    }

    public function findByBarcode(string $barcode): ?ProductionMaterial
    {
        return $this->model->where('barcode', $barcode)->first();
    }

    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model->newQuery();

        // Name filter (partial match)
        if (! empty($filters['name'])) {
            $name = $filters['name'];
            $query->where('name', 'like', "%{$name}%");
        }

        // Search (falls back to name/description/barcode)
        if (! empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%")
                  ->orWhere('barcode', 'like', "%{$s}%");
            });
        }

        // Barcode exact or partial
        if (! empty($filters['barcode'])) {
            $barcode = $filters['barcode'];
            $query->where('barcode', 'like', "%{$barcode}%");
        }

        // Group filter (exact match)
        if (! empty($filters['group_material'])) {
            $query->where('group_material', $filters['group_material']);
        }

        // Availability: 'in_stock' => available_quantity > 0, 'out_of_stock' => = 0
        if (isset($filters['availability'])) {
            if ($filters['availability'] === 'in_stock') {
                $query->where('available_quantity', '>', 0);
            } elseif ($filters['availability'] === 'out_of_stock') {
                $query->where('available_quantity', '<=', 0);
            }
        }

        return $query->orderBy('id', 'desc')->paginate($perPage)->appends($filters);
    }

    public function addQuantity(int $id, float $quantity, ?string $reason = null, ?int $userId = null, ?string $deliveryNumber = null, ?string $deliveryScan = null): ?ProductionMaterial
    {
        return DB::transaction(function () use ($id, $quantity, $reason, $userId, $deliveryNumber, $deliveryScan) {
            $material = $this->model->lockForUpdate()->find($id);

            if (!$material) {
                return null;
            }

            $quantityBefore = $material->available_quantity ?? 0;
            $quantityAfter = $quantityBefore + $quantity;

            $updateData = ['available_quantity' => $quantityAfter];
            if ($deliveryNumber !== null) {
                $updateData['delivery_number'] = $deliveryNumber;
            }
            if ($deliveryScan !== null) {
                $updateData['delivery_scan'] = $deliveryScan;
            }

            $material->update($updateData);

            ProductionMaterialTransaction::create([
                'production_material_id' => $material->id,
                'type' => 'add',
                'quantity' => $quantity,
                'quantity_before' => $quantityBefore,
                'quantity_after' => $quantityAfter,
                'delivery_number' => $deliveryNumber,
                'delivery_scan' => $deliveryScan,
                'reason' => $reason,
                'user_id' => $userId,
            ]);

            return $material->refresh();
        });
    }

    public function subtractQuantity(int $id, float $quantity, ?string $reason = null, ?int $userId = null): ?ProductionMaterial
    {
        return DB::transaction(function () use ($id, $quantity, $reason, $userId) {
            $material = $this->model->lockForUpdate()->find($id);

            if (!$material) {
                return null;
            }

            $quantityBefore = $material->available_quantity ?? 0;

            // Zabezpieczenie: nie można odjąć więcej niż jest dostępne
            if ($quantity > $quantityBefore) {
                throw new \InvalidArgumentException(
                    "Nie można odjąć $quantity jednostek. Dostępne: $quantityBefore"
                );
            }

            $quantityAfter = $quantityBefore - $quantity;

            $material->update(['available_quantity' => $quantityAfter]);

            ProductionMaterialTransaction::create([
                'production_material_id' => $material->id,
                'type' => 'subtract',
                'quantity' => $quantity,
                'quantity_before' => $quantityBefore,
                'quantity_after' => $quantityAfter,
                'reason' => $reason,
                'user_id' => $userId,
            ]);

            return $material->refresh();
        });
    }

    public function getHistory(int $id, int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = ProductionMaterialTransaction::where('production_material_id', $id)
            ->with('user:id,name');

        // Type filter
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        // Date from filter
        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        // Date to filter
        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage)->appends($filters);
    }

    public function getAllTransactions(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = ProductionMaterialTransaction::with(['user:id,name', 'productionMaterial:id,name,barcode']);

        // Material name/barcode search
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->whereHas('productionMaterial', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Type filter
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        // Date from filter
        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        // Date to filter
        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage)->appends($filters);
    }
}
