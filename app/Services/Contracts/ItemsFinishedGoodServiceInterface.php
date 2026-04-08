<?php

namespace App\Services\Contracts;

use App\Repositories\Contracts\ItemsFinishedGoodRepositoryInterface;

interface ItemsFinishedGoodServiceInterface
{
    public function __construct(ItemsFinishedGoodRepositoryInterface $repository);
    public function paginate(int $perPage = 15, array $filters = []);
    public function getWithProcessSummaryPaginated(int $perPage = 15, array $filters = []);

    public function find(int $id);

    public function create(array $data);

    public function update(int $id, array $data);

    public function delete(int $id): bool;
}
