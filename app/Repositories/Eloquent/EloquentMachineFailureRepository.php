<?php


namespace App\Repositories\Eloquent;
use App\Repositories\Contracts\MachineFailureRepositoryInterface;
use App\Models\MachineFailure;
use App\Services\Contracts\MachinesServiceInterface;
use App\Enums\MachineStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentMachineFailureRepository implements MachineFailureRepositoryInterface
{
    public function __construct(private readonly MachineFailure $machineFailure,
                                private readonly MachinesServiceInterface $machineService)
    {
    }
    public function create(array $data): MachineFailure
    {
        $failure = $this->machineFailure->create($data);
        return $failure;
    }
    public function getAllFailuresWithMachines(): array
    {
        return $this->machineFailure->with('machine')->whereNull('finished_repaired_at')->get()->toArray();
    }
    public function findById(int $id): ?MachineFailure
    {
        return $this->machineFailure->find($id);
    }
    public function update(int $id, array $data): bool
    {
        $failure = $this->machineFailure->find($id);
        if (! $failure) {
            return false;
        }
        return (bool) $failure->update($data);
    }

    /**
     * Pobierz wszystkie rekordy awarii dla podanego machine_id.
     *
     * @param int $machineId
     * @return array
     */
    public function getByMachineId(int $machineId): array
    {
        return $this->machineFailure
            ->where('machine_id', $machineId)
            ->orderBy('reported_at', 'desc')
            ->get()
            ->toArray();
    }



     public function delete(int $id): bool
    {
        $failure = $this->machineFailure->findOrFail($id);
        $machineId = $failure->machine_id;

        $deleted = (bool) $failure->delete();

        // TODO: po usunięciu sprawdź czy to był ostatni rekord dla tej maszyny
        // if ($deleted && $machineId) {
        //     $this->setZeroFailureCount($machineId);
        // }

        return $deleted;
    }

    /**
     * Oblicz sumę kosztów napraw dla danej awarii
     */
    public function addAllRepairsCosts(int $machineFailureId, ?string $repairOrderNo = null): float
    {
        return (float) DB::table('machine_failure_repairs')
            ->where('machine_failure_id', $machineFailureId)
            ->when($repairOrderNo, fn($q) => $q->where('repair_order_no', $repairOrderNo))
            ->sum('cost');
    }

    /**
     * Zakończ naprawę awarii
     */
    public function finishRaportedFailure(int $id, array $data): bool
    {
        $failure = $this->machineFailure->find($id);
        if (!$failure) {
            return false;
        }
        return (bool) $failure->update($data);
    }

    /**
     * Get paginated failure history with optional filters.
     * Returns array with `items` and `pagination` metadata.
     */
    public function getFailureHistory(array $filters = [], int $perPage = 15): array
    {
        $query = $this->machineFailure->with('machine');

        if (!empty($filters['barcode'])) {
            $barcode = trim((string)$filters['barcode']);
            $query->whereHas('machine', fn($q) => $q->where('barcode', 'like', "%{$barcode}%"));
        }
        if (!empty($filters['machine_name'])) {
            $name = trim((string)$filters['machine_name']);
            $query->whereHas('machine', fn($q) => $q->where('name', 'like', "%{$name}%"));
        }
        if (!empty($filters['date_from'])) {
            $query->whereDate('reported_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('reported_at', '<=', $filters['date_to']);
        }

        $p = $query->orderBy('reported_at', 'desc')->paginate($perPage);

        return [
            'items' => $p->items(),
            'pagination' => [
                'current_page' => $p->currentPage(),
                'last_page' => $p->lastPage(),
                'per_page' => $p->perPage(),
                'total' => $p->total(),
            ],
        ];
    }

    /**
     * Get paginated list of repaired failures (finished_repaired_at not null) with optional filters and role-based restriction.
     * Returns array with `items` and `pagination` metadata.
     */
    public function getRepairedHistory(array $filters = [], int $perPage = 15, ?string $userRole = null, ?int $userId = null): array
    {
        // eager load machine and basic repairs aggregates for UI (count, sum, latest repair)
        $query = $this->machineFailure->with('machine')
            ->withCount('repairs')
            ->withSum('repairs', 'cost')
            ->with(['repairs' => function ($q) {
                $q->orderBy('started_at', 'desc')->limit(1);
            }]);

        // Only include repaired records
        $query->whereNotNull('finished_repaired_at');

        // Role-based restriction: employees see only their machines (owner or assigned)
        if ($userRole && strtolower($userRole) === 'employee' && $userId) {
            $query->whereHas('machine', function ($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->orWhereHas('users', function ($uq) use ($userId) {
                      $uq->where('user_id', $userId)->orWhere('user_id', $userId);
                  });
            });
        }

        if (!empty($filters['barcode'])) {
            $barcode = trim((string)$filters['barcode']);
            $query->whereHas('machine', fn($q) => $q->where('barcode', 'like', "%{$barcode}%"));
        }
        if (!empty($filters['machine_name'])) {
            $name = trim((string)$filters['machine_name']);
            $query->whereHas('machine', fn($q) => $q->where('name', 'like', "%{$name}%"));
        }
        if (!empty($filters['date_from'])) {
            $query->whereDate('finished_repaired_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->whereDate('finished_repaired_at', '<=', $filters['date_to']);
        }

        $p = $query->orderBy('finished_repaired_at', 'desc')->paginate($perPage);

        return [
            'items' => $p->items(),
            'pagination' => [
                'current_page' => $p->currentPage(),
                'last_page' => $p->lastPage(),
                'per_page' => $p->perPage(),
                'total' => $p->total(),
            ],
        ];
    }

    /**
     * Return the latest MachineFailure for machine with given barcode.
     */
    public function getLatestFailureByMachineBarcode(string $barcode)
    {
        // Try via relation
        $failure = $this->machineFailure->with(['machine','user'])->whereHas('machine', function ($q) use ($barcode) {
            $q->where('barcode', $barcode);
        })->orderBy('reported_at', 'desc')->first();

        return $failure;
    }


}
