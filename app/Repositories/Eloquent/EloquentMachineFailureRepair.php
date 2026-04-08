<?php

namespace App\Repositories\Eloquent;

use App\Repositories\Contracts\MachineFailureRepairRepositoryInterface;
use App\Models\MachineFailureRepair;
use App\Models\MachineFailure;
use Illuminate\Support\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class EloquentMachineFailureRepair implements MachineFailureRepairRepositoryInterface
{
    public function __construct(private readonly MachineFailureRepair $machineFailureRepair,
    private readonly MachineFailure $machineFailure)
    {
    }

public function getFailuresWithMachine(int $machineId): ?MachineFailure
    {
        return $this->machineFailure->where('id', $machineId)->first();
    }

    public function create(array $data): MachineFailureRepair
    {
        $repair = $this->machineFailureRepair->create($data);
        return $repair;
    }

    public function update(int $id, array $data): bool
    {
        $repair = $this->machineFailureRepair->find($id);
        if (!$repair) {
            return false;
        }
        return $repair->update($data);
    }
            public function getFailuresByBarcode(string $barcode): Collection
            {
                $barcode = trim((string) $barcode);
                if ($barcode === '') {
                    return collect();
                }

                // Znajdź awarie po barcode awarii
                $machineFailure = $this->machineFailure->where('barcode', $barcode)->first();

                if (!$machineFailure) {
                    return collect();
                }

                // Pobierz naprawy dla tej awarii
                return $this->machineFailureRepair
                    ->where('machine_failure_id', $machineFailure->id)
                    ->with(['machineFailure.machine'])
                    ->get();
            }

        /**
         * Pobierz naprawy powiązane z awarią (znalezioną po barcode) z paginacją i filtrami
         *
         * @param string $barcode
         * @param int $perPage
         * @param array $filters
         * @return LengthAwarePaginator
         */
        public function getFailuresByBarcodePaginated(string $barcode, int $perPage = 5, array $filters = []): LengthAwarePaginator
        {
            $barcode = trim((string) $barcode);

            // Base query always includes related machine for filtering/display
            $query = $this->machineFailureRepair->with(['machineFailure.machine']);

            // If a barcode was provided and matches a machine failure, limit to that failure
            if ($barcode !== '') {
                $machineFailure = $this->machineFailure->where('barcode', $barcode)->first();
                if ($machineFailure) {
                    $query->where('machine_failure_id', $machineFailure->id);
                }
            }

            // Filters: status, q (search in description/repair_order_no), date_from, date_to
            if (!empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }
            if (!empty($filters['q'])) {
                $q = trim($filters['q']);
                $query->where(function($sub) use ($q) {
                    $sub->where('description', 'like', '%' . $q . '%')
                        ->orWhere('repair_order_no', 'like', '%' . $q . '%')
                        ->orWhereHas('machineFailure.machine', function($mq) use ($q) {
                            $mq->where('barcode', 'like', '%' . $q . '%');
                        });
                });
            }
            if (!empty($filters['date_from'])) {
                $query->whereDate('started_at', '>=', $filters['date_from']);
            }
            if (!empty($filters['date_to'])) {
                $query->whereDate('started_at', '<=', $filters['date_to']);
            }

            return $query->orderBy('started_at', 'desc')->paginate($perPage);
        }
    public function delete(int $id): bool
    {
        $repair = $this->machineFailureRepair->find($id);
        if (!$repair) {
            return false;
        }
        return $repair->delete();
    }

    public function getFailureMachineWithMachine(int $machineId): ?MachineFailure
    {
        return $this->machineFailure->where('id', $machineId)->with('machine')->first();
    }
    public function addAllRepairsCosts(int $machine_failure_id, ?string $repairOrderNo = null): float
    {
        $query = $this->machineFailureRepair->where('machine_failure_id', $machine_failure_id);

        if ($repairOrderNo) {
            $query->where('repair_order_no', $repairOrderNo);
        }

        return (float) $query->sum('cost');
    }
}
