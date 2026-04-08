<?php

namespace App\Repositories\Eloquent;

use App\Models\Order;
use App\Enums\OrderStatus;
use App\Repositories\Contracts\OrderRepositoryInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;

class EloquentOrderRepository implements OrderRepositoryInterface
{
    public function __construct(private readonly Order $model)
    {
    }

    public function paginate(int $perPage = 15, array $filters = [])
    {
        $query = $this->model->newQuery();
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['customer_name'])) {
            $query->where('customer_name', 'like', '%'.$filters['customer_name'].'%');
        }
        return $query->paginate($perPage);
    }

    public function find(int $id): ?Order
    {
        return $this->model->find($id);
    }

    public function create(array $data): Order
    {
        $data['real_finished_at'] = $data['real_finished_at'] ?? null;

        if (
            isset($data['planned_production_at'], $data['finished_at']) &&
            $data['planned_production_at'] > $data['finished_at']
        ) {
            throw ValidationException::withMessages([
                'planned_production_at' => 'Planowany czas produkcji nie może być późniejszy niż planowany czas zakończenia.'
            ]);
        }

        $create = $this->model->create($data);
        if (!$create) {
            throw new ModelNotFoundException('Nie można utworzyć zamówienia');
        }
        return $create;
    }

    public function update(int $id, array $data): ?Order
    {
        $model = $this->find($id);
        if (!$model) return null;
        $model->update($data);
        return $model;
    }

    public function delete(int $id): bool
    {
        $model = $this->find($id);
        if (!$model) return false;
        return (bool) $model->delete();
    }

    public function findByBarcode(string $barcode): ?Order
    {
        return $this->model->where('barcode', $barcode)->first();
    }

    public function getItemsByOrder(int $orderId)
    {
        $order = $this->model->with('items.product')->find($orderId);
        if (!$order) return null;
        return $order->items;
    }

    public function getActiveOrdersPaginated(int $perPage = 15, array $filters = [])
    {
        $activeStatuses = [
            OrderStatus::ACCEPTED->value,
            OrderStatus::IN_PROGRESS->value,
        ];

        $query = $this->model->newQuery()
            ->withCount('items')
            ->whereIn('status', $activeStatuses);

        if (!empty($filters['customer_name'])) {
            $query->where('customer_name', 'like', '%'.$filters['customer_name'].'%');
        }

        return $query->paginate($perPage, ['*'], 'orders_page');
    }
}
