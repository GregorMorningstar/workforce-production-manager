<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\Contracts\MachinesServiceInterface;
use App\Services\Contracts\MachineFailureServiceInterface;
use App\Services\Contracts\MachineFailureRepairServiceInterface;
use App\Models\MachineFailureRepair;
class MachineFailuresController extends Controller
{
    private MachinesServiceInterface $machineService;
    private MachineFailureServiceInterface $machineFailureService;

    public function __construct(MachinesServiceInterface $machineService,
                                MachineFailureServiceInterface $machineFailureService,
                                MachineFailureRepairServiceInterface $machineFailureRepairService)
    {
        $this->machineService = $machineService;
        $this->machineFailureService = $machineFailureService;
        $this->machineFailureRepairService = $machineFailureRepairService;
    }
    public function index()
    {
        $userMachinesFailures =  $this->machineService->getUserMachines(auth()->id(), 15);
        $allmachineFailures = $this->machineFailureService->getAllFailuresWithMachines();
      //  dd($allmachineFailures);

        return Inertia::render('machines/failures/index',[
            'allmachineFailures' => $allmachineFailures,
            'userMachinesFailures' => $userMachinesFailures]);
     }

    public function history(Request $request)
    {
        $perPage = (int) $request->get('per_page', 15);
        $filters = $request->only(['barcode', 'machine_name', 'date_from', 'date_to']);

        $history = $this->machineFailureService->getFailureHistory($filters, $perPage);

        return Inertia::render('machines/failures/history', [
            'history' => $history,
            'filters' => $filters,
        ]);
     }

    public function create($machine_id)
    {
        return Inertia::render('machines/failures/create', ['machine_id' => $machine_id]);
     }

    public function show($id)
    {
        // Logic to show a specific machine failure
    }
    public function store(Request $request)
    {
        $data = $request->validate([
            'machine_id' => 'required|exists:machines,id',
            'failure_rank' => 'required|integer|min:1|max:10',
            'failure_description' => 'required|string|max:2000',
        ]);
        $data['user_id'] = $request->user()->id;
        $this->machineFailureService->createMachineFailure($data, (int) $data['machine_id']);
        return redirect()->route('machines.failures.history.index')->with('success', 'Zgłoszono awarie.');
    }
    public function edit($id)
    {

        $editFailure = $this->machineFailureService->findFailureById($id);
      //  dd($editFailure);
        return Inertia::render('machines/failures/edit', ['id' => $id, 'editFailure' => $editFailure]);
    }
    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'failure_description' => 'required|string|max:2000',
            'failure_rank' => 'nullable|integer|min:1|max:10',
        ]);

        $updated = $this->machineFailureService->updateMachineFailure($id, $data);

        if ($updated) {
            return redirect()->route('machines.report-failure')->with('success', 'Zaktualizowano zgłoszenie awarii.');
              } else {
            return redirect()->back()->with('error', 'Nie udało się zaktualizować zgłoszenia awarii.');
        }
    }
    public function destroy($id)
    {
        $deleted = $this->machineFailureService->deleteMachineFailure($id);

        if ($deleted) {
            return redirect()->route('machines.report-failure')->with('success', 'Usunięto zgłoszenie awarii.');
        }

        return redirect()->back()->with('error', 'Nie udało się usunąć zgłoszenia awarii.');
    }
    public function repariedList(Request $request)
    {
        $barcode = (string) $request->get('barcode', '');
        $perPage = 5;
        $filters = $request->only(['status', 'q', 'date_from', 'date_to']);

        $paginator = $this->machineFailureRepairService->getFailuresByBarcodePaginated($barcode, $perPage, $filters);

        $repairs = $paginator->items();
        $pagination = [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];

        return Inertia::render('machines/failures/repairs/repairsList', [
            'repairs' => $repairs,
            'pagination' => $pagination,
            'filters' => $filters,
            'barcode' => $barcode,
        ]);
    }

    /**
     * Show history of repaired failures (machine_failures.finished_repaired_at IS NOT NULL)
     */
    public function repairsHistory(Request $request)
    {
        $perPage = (int) $request->get('per_page', 15);
        $filters = $request->only(['barcode', 'machine_name', 'date_from', 'date_to']);

        $rawRole = auth()->user()->role ?? '';
        $userRole = strtolower((string)$rawRole);
        $userId = auth()->id();

        $history = $this->machineFailureService->getRepairedHistory($filters, $perPage, $userRole, $userId);

        return Inertia::render('machines/failures/repairs/history', [
            'history' => $history,
            'filters' => $filters,
        ]);
    }


    public function listByFailure(Request $request, $failureId)
    {
        $perPage = (int) $request->get('per_page', 15);
        $filters = $request->only(['status', 'q', 'date_from', 'date_to']);

        $paginator = $this->machineFailureRepairService->getRepairsByFailureIdPaginated($failureId, $perPage, $filters);

        $repairs = $paginator->items();
        $pagination = [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];

        return Inertia::render('machines/failures/repairs/repairsList', [
            'repairs' => $repairs,
            'pagination' => $pagination,
            'filters' => $filters,
            'failureId' => $failureId,
        ]);
    }
}
