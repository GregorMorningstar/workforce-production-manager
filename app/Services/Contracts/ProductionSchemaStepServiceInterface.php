<?php

namespace App\Services\Contracts;

interface ProductionSchemaStepServiceInterface
{
    public function __construct(\App\Repositories\Contracts\ProductionSchemaStepRepositoryInterface $repository, \App\Repositories\Contracts\ItemsFinishedGoodRepositoryInterface $itemsRepository);

    public function find(int $id);

    public function findBySchema(int $schemaId);

    public function create(array $data);

    public function update(int $id, array $data);

    public function delete(int $id): bool;
}
