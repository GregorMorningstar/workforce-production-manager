<?php

namespace App\Services;

use App\Services\Contracts\OrderServiceInterface;
use App\Repositories\Contracts\OrderRepositoryInterface;

class OrderService implements OrderServiceInterface
{
    public function __construct(private readonly OrderRepositoryInterface $repo)
    {
    }

    public function paginate(int $perPage = 15, array $filters = [])
    {
        return $this->repo->paginate($perPage, $filters);
    }

    public function find(int $id)
    {
        return $this->repo->find($id);
    }

    public function create(array $data)
    {
        return $this->repo->create($data);
    }

    public function update(int $id, array $data)
    {
        return $this->repo->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->repo->delete($id);
    }

    public function findByBarcode(string $barcode)
    {
        return $this->repo->findByBarcode($barcode);
    }

    public function getItemsByOrder(int $orderId)
    {
        return $this->repo->getItemsByOrder($orderId);
    }

    public function getActiveOrdersPaginated(int $perPage = 15, array $filters = [])
    {
        return $this->repo->getActiveOrdersPaginated($perPage, $filters);
    }
}
