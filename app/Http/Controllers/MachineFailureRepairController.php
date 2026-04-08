<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Enums\MachineFailureRepairsStatus;
use App\Models\MachineFailureRepair;
use App\Models\MachineFailure;
use App\Models\MachineFailureRepairAction;
use App\Services\Contracts\MachineFailureRepairServiceInterface;
class MachineFailureRepairController extends Controller
{



public function __construct(private readonly MachineFailureRepairServiceInterface $machineFailureRepairService)
    {
    }
    public function createRaportedFailure(Request $request)
    {
        $machineFailureId = $request->get('machine_failure_id');
        $repairOrderNo = $request->get('repair_order_no');

        $machineFailure = null;

        if ($machineFailureId) {
            $machineFailure = MachineFailure::with(['machine', 'user'])->find((int)$machineFailureId);
        }

        // If machine_failure_id not provided, allow lookup by barcode.
        // The barcode in the query can be either a MachineFailure.barcode (prefix 3200...)
        // or a Machines.barcode (prefix 3000...). Try both.
        if (!$machineFailure) {
            $barcode = $request->get('barcode');
            if ($barcode) {
                // First try to find MachineFailure by its own barcode (e.g. 3200...)
                $machineFailure = MachineFailure::with(['machine', 'user'])
                    ->where('barcode', $barcode)
                    ->first();

                // Then try to find via related machine.barcode (e.g. 3000...)
                if (!$machineFailure) {
                    $machineFailure = MachineFailure::with(['machine', 'user'])
                        ->whereHas('machine', function ($q) use ($barcode) {
                            $q->where('barcode', $barcode);
                        })->first();
                }

                // As a last resort, use service helper that finds latest failure by machine barcode
                if (!$machineFailure) {
                    $machineFailure = app()->make(\App\Services\Contracts\MachineFailureServiceInterface::class)
                        ->getLatestFailureByMachineBarcode($barcode);
                    if ($machineFailure) {
                        $machineFailure->load(['machine', 'user']);
                    }
                }
            }
        }
        $statuses = MachineFailureRepairsStatus::toSelectArray();

        return Inertia::render('machines/failures/repairs/create', [
            'machineFailure' => $machineFailure,
            'repairOrderNo' => $repairOrderNo,
            'statuses' => $statuses,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'machine_failure_id' => ['required','integer','exists:machine_failures,id'],
            'status' => ['required','string'],
            'cost' => ['nullable','numeric'],
            'description' => ['nullable','string'],
            'started_at' => ['nullable','date'],
            'finished_at' => ['nullable','date'],
        ]);

        // Ustaw finished_at jeśli status to REPAIRED lub REJECTED
        if (in_array($data['status'], [
            MachineFailureRepairsStatus::REPAIRED->value,
            MachineFailureRepairsStatus::REJECTED->value
        ], true)) {
            $data['finished_at'] = now();
        }

        // Pobierz powiązaną awarię (z maszyną) aby wygenerować numer zlecenia przed zapisem.
        $machineFailure = null;
        try {
            $machineFailure = $this->machineFailureRepairService->getFailureMachineWithMachine($data['machine_failure_id']);
        } catch (\Throwable $e) {
            // nie przerywamy, wygenerujemy numer z domyślnym prefiksem
        }

        // Generuj repair_order_no przed create, aby uniknąć błędu gdy kolumna wymaga wartości
        $barcodeForOrder = $machineFailure->machine->barcode ?? ($request->get('barcode') ?? null) ?? 'unknown';
        $repairOrderNo = 'RO-' . $barcodeForOrder . '/' . date('d-m-Y');
        $data['repair_order_no'] = $repairOrderNo;

        // Utwórz rekord naprawy
        $repair = MachineFailureRepair::create($data);

        if ($repair) {
            try {
                // Jeśli potrzebne, zaktualizuj lokalny obiekt machineFailure (już mógł być pobrany)
                if (!$machineFailure) {
                    $machineFailure = $this->machineFailureRepairService->getFailureMachineWithMachine($repair->machine_failure_id);
                }

                // Jeśli status to REPAIRED/REJECTED, oblicz sumę kosztów i zaktualizuj machine_failures
                if (in_array($data['status'], [
                    MachineFailureRepairsStatus::REPAIRED->value,
                    MachineFailureRepairsStatus::REJECTED->value
                ], true)) {
                    // Oblicz sumę wszystkich kosztów napraw dla tej awarii
                    $totalCost = $this->machineFailureRepairService->addAllRepairsCosts($data['machine_failure_id']);

                    // Zaktualizuj machine_failures: total_cost i finished_repaired_at
                    MachineFailure::where('id', $data['machine_failure_id'])->update([
                        'total_cost' => $totalCost,
                        'finished_repaired_at' => now(),
                    ]);
                }

                return redirect()->route('machines.failures.repairs.reparied.list', ['barcode' => $machineFailure->barcode])
                    ->with('success', 'Naprawa zapisana pomyślnie');
            } catch (\Exception $e) {
                return redirect()->back()
                    ->with('error', 'Dodanie zlecenia naprawy nie powiodło się: ' . $e->getMessage());
            }
        }



    }

    public function createRaportedFailureNextStep(Request $request, $id)
    {
        $machineFailureRepair = $this->machineFailureRepairService->getFailureMachineWithMachine($id);
        $statuses = MachineFailureRepairsStatus::toSelectArray();

        return Inertia::render('machines/failures/repairs/create_nextstep', [
            'machineFailureRepair' => $machineFailureRepair,
            'statuses' => $statuses,
        ]);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'status' => ['required','string'],
            'cost' => ['nullable','numeric'],
            'description' => ['nullable','string'],
            'started_at' => ['nullable','date'],
        ]);

        // If status is final, set finished_at automatically
        if (in_array($data['status'], [
            MachineFailureRepairsStatus::REPAIRED->value,
            MachineFailureRepairsStatus::REJECTED->value
        ], true)) {
            $data['finished_at'] = now();
        }

        try {
            // load existing repair to get machine_failure_id
            $existing = MachineFailureRepair::find($id);
            if (!$existing) {
                return redirect()->back()->with('error', 'Rekord nie istnieje.');
            }

            // Prevent changing status to final states via edit
            if (isset($data['status']) && in_array($data['status'], [
                MachineFailureRepairsStatus::REPAIRED->value,
                MachineFailureRepairsStatus::REJECTED->value,
            ], true) && $existing->status !== $data['status']) {
                return redirect()->back()->with('error', 'Nie można ustawić statusu na Naprawiony ani Odrzucony podczas edycji.');
            }

            $ok = $this->machineFailureRepairService->update((int)$id, $data);
            if (!$ok) {
                return redirect()->back()->with('error', 'Aktualizacja nie powiodła się (rekord nie znaleziony).');
            }

            // If final status, recalculate total cost and mark machine failure finished
            if (isset($data['finished_at'])) {
                $machineFailureId = $existing->machine_failure_id;
                $totalCost = $this->machineFailureRepairService->addAllRepairsCosts($machineFailureId);
                MachineFailure::where('id', $machineFailureId)->update([
                    'total_cost' => $totalCost,
                    'finished_repaired_at' => now(),
                ]);
            }

            return redirect()->back()->with('success', 'Rekord został zaktualizowany.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Błąd podczas aktualizacji: ' . $e->getMessage());
        }
    }

    // Actions management
    public function listActions(Request $request, $id)
    {
        $actions = MachineFailureRepairAction::where('machine_failure_repair_id', $id)->orderBy('performed_at', 'desc')->get();
        return response()->json(['data' => $actions]);
    }

    /**
     * Return JSON list of repairs for a given machine_failure id (including actions)
     */
    public function listByFailure(Request $request, $failureId)
    {
        $repairs = MachineFailureRepair::where('machine_failure_id', (int)$failureId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($repairs);
    }

    public function storeAction(Request $request, $id)
    {
        $data = $request->validate([
            'description' => ['required','string'],
        ]);
        $action = MachineFailureRepairAction::create([
            'machine_failure_repair_id' => $id,
            'description' => $data['description'],
            'user_id' => $request->user()->id,
            'performed_at' => now(),
        ]);
        return response()->json(['data' => $action], 201);
    }

    public function updateAction(Request $request, $id, $actionId)
    {
        $data = $request->validate([
            'description' => ['required','string'],
        ]);
        $action = MachineFailureRepairAction::where('machine_failure_repair_id', $id)->findOrFail($actionId);
        $action->description = $data['description'];
        $action->save();
        return response()->json(['data' => $action]);
    }

    public function destroyAction(Request $request, $id, $actionId)
    {
        $action = MachineFailureRepairAction::where('machine_failure_repair_id', $id)->findOrFail($actionId);
        $action->delete();
        return response()->json([], 204);
    }

    public function destroy($id)
    {
        try {
            $this->machineFailureRepairService->delete($id);
            return redirect()->back()->with('success', 'Rekord naprawy maszyny został pomyślnie usunięty.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Usunięcie rekordu naprawy maszyny nie powiodło się: ' . $e->getMessage());
        }
    }
}

