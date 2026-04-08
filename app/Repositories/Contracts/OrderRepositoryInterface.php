<?php

namespace App\Repositories\Contracts;

use App\Models\Order;

interface OrderRepositoryInterface
{
    public function __construct(Order $model);

    public function getActiveOrdersPaginated(int $perPage = 15, array $filters = []);

    public function paginate(int $perPage = 15, array $filters = []);

    public function find(int $id): ?Order;

    public function create(array $data): Order;

    public function update(int $id, array $data): ?Order;

    public function delete(int $id): bool;

    /**
     * Find order by barcode
     */
    public function findByBarcode(string $barcode): ?Order;

    /**
     * Get items for given order id
     */
    public function getItemsByOrder(int $orderId);
}
