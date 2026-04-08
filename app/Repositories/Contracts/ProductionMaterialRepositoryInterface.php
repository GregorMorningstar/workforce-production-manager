<?php

namespace App\Repositories\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Models\ProductionMaterial;

interface ProductionMaterialRepositoryInterface
{
    public function create(array $data): ProductionMaterial;

    public function update(int $id, array $data): ?ProductionMaterial;

    public function delete(int $id): bool;

    public function findById(int $id): ?ProductionMaterial;

    public function findByBarcode(string $barcode): ?ProductionMaterial;

    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator;

    public function addQuantity(int $id, float $quantity, ?string $reason = null, ?int $userId = null, ?string $deliveryNumber = null, ?string $deliveryScan = null): ?ProductionMaterial;

    public function subtractQuantity(int $id, float $quantity, ?string $reason = null, ?int $userId = null): ?ProductionMaterial;

    public function getHistory(int $id, int $perPage = 15, array $filters = []): LengthAwarePaginator;

    public function getAllTransactions(int $perPage = 15, array $filters = []): LengthAwarePaginator;
}
