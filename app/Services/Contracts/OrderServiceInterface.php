<?php

namespace App\Services\Contracts;

interface OrderServiceInterface
{
    public function paginate(int $perPage = 15, array $filters = []);

    public function find(int $id);

    public function create(array $data);

    public function update(int $id, array $data);

    public function delete(int $id): bool;

    public function findByBarcode(string $barcode);

    public function getItemsByOrder(int $orderId);

    public function getActiveOrdersPaginated(int $perPage = 15, array $filters = []);
}
