<?php

namespace App\Services\Contracts;

interface ProductionSchemaServiceInterface
{
    public function __construct(\App\Repositories\Contracts\ProductionSchemaRepositoryInterface $repository);

    public function find(int $id);

    public function findByItem(int $itemId);

    public function create(array $data);

    public function update(int $id, array $data);

    public function delete(int $id): bool;
}
