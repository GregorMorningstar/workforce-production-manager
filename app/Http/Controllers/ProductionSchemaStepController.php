<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\Contracts\ProductionSchemaStepServiceInterface;
use Illuminate\Http\Request;

class ProductionSchemaStepController extends Controller
{
    public function __construct(private readonly ProductionSchemaStepServiceInterface $service)
    {
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'production_schema_id' => 'required|integer|exists:production_schemas,id',
            'step_number' => 'required|integer|min:1',
            'machine_id' => 'nullable|integer|exists:machines,id',
            'operationmachine_id' => 'nullable|integer|exists:operationmachines,id',
            'production_material_id' => 'nullable|integer|exists:production_materials,id',
            'required_quantity' => 'nullable|numeric',
            'unit' => 'nullable|string',
            'production_time_seconds' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $step = $this->service->create($data);
        return redirect()->back();
    }

    public function update(int $id, Request $request)
    {
        $data = $request->validate([
            'step_number' => 'required|integer|min:1',
            'machine_id' => 'nullable|integer|exists:machines,id',
            'operationmachine_id' => 'nullable|integer|exists:operationmachines,id',
            'production_material_id' => 'nullable|integer|exists:production_materials,id',
            'required_quantity' => 'nullable|numeric',
            'unit' => 'nullable|string',
            'production_time_seconds' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $this->service->update($id, $data);
        return redirect()->back();
    }

    public function destroy(int $id)
    {
        $this->service->delete($id);
        return redirect()->back();
    }
}
