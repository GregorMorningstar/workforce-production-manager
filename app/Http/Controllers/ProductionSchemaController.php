<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\Contracts\ProductionSchemaServiceInterface;
use App\Services\Contracts\ProductionSchemaStepServiceInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Machines;
use App\Models\Operationmachine;
use App\Models\ProductionMaterial;
use App\Models\ItemsFinishedGood;
use App\Models\ProductionSchemaStep;
use App\Enums\MaterialForm;
use App\Enums\MachineStatus;
use Illuminate\Support\Facades\DB;

class ProductionSchemaController extends Controller
{
    public function __construct(
        private readonly ProductionSchemaServiceInterface $service,
        private readonly ProductionSchemaStepServiceInterface $stepService
    ) {
    }

    public function showByItem(int $id)
    {
        $schema = $this->service->findByItem($id);

        // C:\xampp\htdocs\Pans_Master_APP\resources\js\pages\items\schema\productionPlanSchemaByItem.tsx
        return Inertia::render('items/schema/productionPlanSchemaByItem', [
            'schema' => $schema,
            'itemId' => $id,
            'machineStatusMap' => MachineStatus::toArray(),
        ]);
    }

    public function index(Request $request)
    {
        $q = $request->get('q');

        $schemas = \App\Models\ProductionSchema::with(['item', 'steps'])
            ->when($q, function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                      ->orWhereHas('item', function ($q2) use ($q) {
                          $q2->where('name', 'like', "%{$q}%");
                      });
            })
            ->orderBy('id', 'desc')
            ->paginate(10)
            ->appends($request->query());

        return Inertia::render('moderator/items/schemas/index', [
            'schemas' => $schemas,
            'filters' => ['q' => $q],
        ]);
    }

    /**
     * Lightweight endpoint to open the production planning page with all schemas.
     * The planning page will load and display all schemas.
     */
    public function getAll(Request $request)
    {
        return redirect()->route('moderator.production.index');
    }

    public function createStep(int $itemId)
    {
        $item = ItemsFinishedGood::findOrFail($itemId);

        // Pobierz lub utwórz schemat
        $schema = $this->service->findByItem($itemId);
        if (!$schema) {
            $schema = $this->service->create([
                'items_finished_good_id' => $itemId,
                'name' => 'Schemat produkcji - ' . $item->name,
            ]);
        }

        // Oblicz numer kroku (ilość istniejących kroków + 1)
        $stepNumber = ProductionSchemaStep::where('production_schema_id', $schema->id)->count() + 1;

        // Pobierz dostępne maszyny, operacje i materiały
        $machines = Machines::select('id', 'name', 'serial_number', 'model')->orderBy('name')->get();
        $operations = Operationmachine::select('id', 'operation_name', 'machine_id')->orderBy('operation_name')->get();
        $materials = ProductionMaterial::select('id', 'name', 'group_material', 'material_form')->orderBy('name')->get();

        return Inertia::render('items/schema/createStep', [
            'item' => $item,
            'schema' => $schema,
            'stepNumber' => $stepNumber,
            'machines' => $machines,
            'operations' => $operations,
            'materials' => $materials,
            'machineStatusMap' => MachineStatus::toArray(),
                'materialForms' => MaterialForm::toArray(),
        ]);
    }

    public function storeStep(int $itemId, Request $request)
    {
        $schema = $this->service->findByItem($itemId);
        if (!$schema) {
            return redirect()->back()->with('error', 'Schemat nie został znaleziony');
        }

        $data = $request->validate([
            'step_number' => 'required|integer|min:1',
            'machine_id' => 'required|exists:machines,id',
            'operationmachine_id' => 'required|exists:operationmachines,id',
            'production_material_id' => 'nullable|exists:production_materials,id',
            'required_quantity' => 'nullable|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'output_product_name' => 'nullable|string|max:255',
            'output_quantity' => 'nullable|numeric|min:0',
            'production_time_seconds' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $data['production_schema_id'] = $schema->id;

        // Jeśli wybrano materiał, ustaw w tabeli production_materials stock_empty_alarm = 0
        if (!empty($data['production_material_id'])) {
            ProductionMaterial::where('id', $data['production_material_id'])->update(['stock_empty_alarm' => 0]);
        }

        $this->stepService->create($data);

        return redirect()->route('moderator.items.production_schema.show', $itemId)
            ->with('success', 'Krok został dodany pomyślnie');
    }

    public function update(int $id, Request $request)
    {
        $data = $request->validate([
            'name' => 'nullable|string',
        ]);

        $this->service->update($id, $data);
        return redirect()->back();
    }

    public function editStep(int $stepId)
    {
        $step = ProductionSchemaStep::with(['schema.item'])->findOrFail($stepId);
        $item = $step->schema->item;

        // Pobierz dostępne maszyny, operacje i materiały
        $machines = Machines::select('id', 'name', 'serial_number', 'model', 'status')->orderBy('name')->get();
        $operations = Operationmachine::select('id', 'operation_name', 'machine_id')->orderBy('operation_name')->get();
        $materials = ProductionMaterial::select('id', 'name', 'group_material', 'material_form')->orderBy('name')->get();

        return Inertia::render('items/schema/editStep', [
            'step' => $step,
            'item' => $item,
            'machines' => $machines,
            'operations' => $operations,
            'materials' => $materials,
            'machineStatusMap' => MachineStatus::toArray(),
                'materialForms' => MaterialForm::toArray(),
        ]);
    }

    public function updateStep(int $stepId, Request $request)
    {
        $step = ProductionSchemaStep::findOrFail($stepId);

        $data = $request->validate([
            'step_number' => 'required|integer|min:1',
            'machine_id' => 'required|exists:machines,id',
            'operationmachine_id' => 'required|exists:operationmachines,id',
            'production_material_id' => 'nullable|exists:production_materials,id',
            'required_quantity' => 'nullable|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'output_product_name' => 'nullable|string|max:255',
            'output_quantity' => 'nullable|numeric|min:0',
            'production_time_seconds' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $this->stepService->update($stepId, $data);

        $itemId = $step->schema->items_finished_good_id;

        return redirect()->route('moderator.items.production_schema.show', $itemId)
            ->with('success', 'Krok został zaktualizowany pomyślnie');
    }

    public function destroyStep(int $stepId)
    {
        $step = ProductionSchemaStep::findOrFail($stepId);
        $itemId = $step->schema->items_finished_good_id;

        $this->stepService->delete($stepId);

        return redirect()->route('moderator.items.production_schema.show', $itemId)
            ->with('success', 'Krok został usunięty pomyślnie');
    }

    /**
     * Reorder steps for a given item's production schema.
     * Expects JSON: { ordered_ids: [stepId1, stepId2, ...] }
     */
    public function reorderSteps(int $itemId, Request $request)
    {
        $data = $request->validate([
            'ordered_ids' => 'required|array',
            'ordered_ids.*' => 'integer',
        ]);

        $schema = $this->service->findByItem($itemId);
        if (!$schema) {
            return response()->json(['success' => false, 'message' => 'Schemat nie znaleziony'], 404);
        }

        $ordered = $data['ordered_ids'];

        // Validate that all provided ids belong to this schema
        $count = ProductionSchemaStep::where('production_schema_id', $schema->id)
            ->whereIn('id', $ordered)
            ->count();

        if ($count !== count($ordered)) {
            return response()->json(['success' => false, 'message' => 'Nieprawidłowe id kroków'], 422);
        }

        DB::transaction(function () use ($ordered, $schema) {
            foreach ($ordered as $index => $stepId) {
                ProductionSchemaStep::where('production_schema_id', $schema->id)
                    ->where('id', $stepId)
                    ->update(['step_number' => $index + 1]);
            }
        });

        return response()->json(['success' => true]);
    }

    public function destroy(int $id)
    {
        $this->service->delete($id);
        return redirect()->back();
    }
}
