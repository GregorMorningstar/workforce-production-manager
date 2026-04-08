<?php

namespace App\Repositories\Contracts;

use App\Models\ItemsFinishedGood;

interface ItemsFinishedGoodRepositoryInterface
{
    public function __construct(ItemsFinishedGood $model);
    public function paginate(int $perPage = 15, array $filters = []);
    public function getWithProcessSummaryPaginated(int $perPage = 15, array $filters = []);

    public function find(int $id);

    public function create(array $data);

    public function update(int $id, array $data);

    public function delete(int $id): bool;
}
