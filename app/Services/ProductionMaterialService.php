<?php

namespace App\Services;

use App\Services\Contracts\ProductionMaterialServiceInterface;
use App\Repositories\Contracts\ProductionMaterialRepositoryInterface;
use App\Models\ProductionMaterial;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductionMaterialService implements ProductionMaterialServiceInterface
{
    public function __construct(private readonly ProductionMaterialRepositoryInterface $repository)
    {
    }

    public function create(array $data): ProductionMaterial
    {
        return $this->repository->create($data);
    }

    public function update(int $id, array $data): ?ProductionMaterial
    {
        return $this->repository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }

    public function find(int $id): ?ProductionMaterial
    {
        return $this->repository->findById($id);
    }

    public function findByBarcode(string $barcode): ?ProductionMaterial
    {
        return $this->repository->findByBarcode($barcode);
    }

    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginate($perPage, $filters);
    }

    public function addQuantity(int $id, float $quantity, ?string $reason = null, ?int $userId = null, ?string $deliveryNumber = null, ?string $deliveryScan = null): ?ProductionMaterial
    {
        return $this->repository->addQuantity($id, $quantity, $reason, $userId, $deliveryNumber, $deliveryScan);
    }

    public function subtractQuantity(int $id, float $quantity, ?string $reason = null, ?int $userId = null): ?ProductionMaterial
    {
        return $this->repository->subtractQuantity($id, $quantity, $reason, $userId);
    }

    public function getHistory(int $id, int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getHistory($id, $perPage, $filters);
    }

    public function getAllTransactions(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getAllTransactions($perPage, $filters);
    }
}
