<?php

namespace App\Services;

use App\Services\Contracts\ProductionSchemaServiceInterface;
use App\Repositories\Contracts\ProductionSchemaRepositoryInterface;

class ProductionSchemaService implements ProductionSchemaServiceInterface
{
    public function __construct(private readonly ProductionSchemaRepositoryInterface $repository)
    {
    }

    public function find(int $id)
    {
        return $this->repository->find($id);
    }

    public function findByItem(int $itemId)
    {
        return $this->repository->findByItem($itemId);
    }

    public function create(array $data)
    {
        return $this->repository->create($data);
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
