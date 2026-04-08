<?php



namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Services\MachineService;
use App\Services\OperationMachineService;
use App\Models\Operation;
use App\Services\Contracts\OperationMachineServiceInterface;

class MachineOperationController extends Controller
{
    public function __construct(
        private readonly MachineService $machineService,
        private readonly OperationMachineService $operationMachineService
    ) {
    }

    public function getAllOperations(Request $request)
    {
        $allOperations = $this->operationMachineService->getAllOperationsWithMachines();
//dd($allOperations);
        if ($allOperations instanceof LengthAwarePaginator) {
            $items = $allOperations->items();
            $meta = [
                'total'        => $allOperations->total(),
                'per_page'     => $allOperations->perPage(),
                'current_page' => $allOperations->currentPage(),
                'last_page'    => $allOperations->lastPage(),
            ];
        } else {
            // Kolekcja lub tablica
            $items = is_array($allOperations) ? $allOperations : ($allOperations->toArray() ?? []);
            $meta = null;
        }

        return Inertia::render('moderator/machines/operations/index', [
            'allOperations' => $items,
            'pagination'    => $meta,
        ]);
    }

    public function createOperation($machine_id)
    {
        return Inertia::render('moderator/machines/operations/create', [
            'machine_id' => $machine_id,
        ]);
    }

    public function storeOperation(Request $request, $machine_id)
    {
        \Log::info('storeOperation called', ['machine_id' => $machine_id, 'data' => $request->all()]);

        // walidacja danych wejściowych
        $validated = $request->validate([
            'operation_name'   => 'required|string|max:255',
            'description'      => 'nullable|string|max:1000',
            'changeover_time'  => 'nullable|numeric|min:0',
        ], [
            'operation_name.required' => 'Nazwa operacji jest wymagana.',
            'operation_name.max' => 'Nazwa operacji nie może być dłuższa niż 255 znaków.',
            'description.max' => 'Opis nie może być dłuższy niż 1000 znaków.',
            'changeover_time.numeric' => 'Czas przezbrojenia musi być liczbą.',
            'changeover_time.min' => 'Czas przezbrojenia nie może być ujemny.',
        ]);

        try {
            \Log::info('Validation passed', $validated);

            // sprawdź czy maszyna istnieje
            $machine = $this->machineService->findById($machine_id);
            \Log::info('Machine found', ['machine' => $machine ? $machine->toArray() : null]);

            if (!$machine) {
                \Log::error('Machine not found', ['machine_id' => $machine_id]);
                return redirect()->route('moderator.machines.operations.index')
                    ->with('error', 'Maszyna nie została znaleziona.');
            }

            // zapisz operację bezpośrednio w tabeli operationmachines (bez osobnej tabeli operations)
            \Log::info('Creating operation with data', [
                'machine_id' => $machine_id,
                'operation_name' => $validated['operation_name'],
                'description' => $validated['description'] ?? null,
                'changeover_time' => $validated['changeover_time'] ?? null,
            ]);

            $operationMachine = $this->operationMachineService->createOperation($machine_id, 0, [
                'operation_name' => $validated['operation_name'],
                'description' => $validated['description'] ?? null,
                'duration_minutes' => $validated['duration_minutes'] ?? null,
                'changeover_time' => $validated['changeover_time'] ?? null,
            ]);

            \Log::info('Operation created', ['operation' => $operationMachine ? $operationMachine->toArray() : null]);

            return redirect()->route('moderator.machines.operations.index')
                ->with('success', "Operacja '{$validated['operation_name']}' została pomyślnie dodana do maszyny '{$machine->name}'.");

        } catch (\Throwable $e) {
            return redirect()->back()
                ->withInput()
                ->with('error', 'Wystąpił błąd podczas zapisu operacji: ' . $e->getMessage());
        }
    }

    public function showOperation($operation_id)
    {
        return Inertia::render('moderator/machines/operations/show', [
            'operation_id' => $operation_id,
        ]);
    }

    public function editOperation($operation_id)
    {
        $findOperation = $this->operationMachineService->findById((int)$operation_id);

        if (!$findOperation) {
            return redirect()->route('moderator.machines.operations.index')
                ->with('error', 'Nie znaleziono operacji o podanym ID.');
        }

        $findOperation->loadMissing(['machine', 'machine.department']);

        return Inertia::render('moderator/machines/operations/edit', [
            'findOperation' => $findOperation->toArray(),
        ]);
    }
    public function updateOperation(Request $request, $operation_id)
    {
        // walidacja danych wejściowych
        $validated = $request->validate([
            'operation_name'   => 'required|string|max:255',
            'description'      => 'nullable|string|max:1000',
            'changeover_time'  => 'nullable|numeric|min:0',
        ], [
            'operation_name.required' => 'Nazwa operacji jest wymagana.',
            'operation_name.max' => 'Nazwa operacji nie może być dłuższa niż 255 znaków.',
            'description.max' => 'Opis nie może być dłuższy niż 1000 znaków.',
            'changeover_time.numeric' => 'Czas przezbrojenia musi być liczbą.',
            'changeover_time.min' => 'Czas przezbrojenia nie może być ujemny.',
        ]);
//dd($validated);
        try {
            $this->operationMachineService->updateOperation((int)$operation_id, $validated);

            return redirect()->route('moderator.machines.operations.index')
                ->with('success', "Operacja '{$validated['operation_name']}' została pomyślnie zaktualizowana.");

        } catch (\Throwable $e) {
            return redirect()->back()
                ->withInput()
                ->with('error', 'Wystąpił błąd podczas aktualizacji operacji: ' . $e->getMessage());
        }
    }
    public function destroyOperation($operation_id)
    {
        try {
            $deleted = $this->operationMachineService->deleteOperation((int)$operation_id);

            if (!$deleted) {
                return redirect()->back()->with('error', 'Nie udało się usunąć operacji.');
            }

            return redirect()->route('moderator.machines.operations.index')
                ->with('success', 'Operacja została usunięta.');
        } catch (\Exception $e) {
            \Log::error('Delete operation error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Błąd usuwania: ' . $e->getMessage());
        }
    }

    public function quickStore(Request $request)
    {
        $validated = $request->validate([
            'operation_name' => 'required|string|max:255',
            'machine_id' => 'required|exists:machines,id',
            'changeover_time' => 'nullable|numeric|min:0',
        ]);

        try {
            $operation = $this->operationMachineService->createOperation(
                $validated['machine_id'],
                0,
                [
                    'operation_name' => $validated['operation_name'],
                    'changeover_time' => $validated['changeover_time'] ?? null,
                ]
            );

            return response()->json([
                'success' => true,
                    'operation' => [
                    'id' => $operation->id,
                    'operation_name' => $operation->operation_name,
                    'machine_id' => $operation->machine_id,
                    'changeover_time' => $operation->changeover_time,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas tworzenia operacji: ' . $e->getMessage(),
            ], 500);
        }
    }
}
