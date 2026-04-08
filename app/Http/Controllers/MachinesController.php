<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Department;
use App\Models\User;
use App\Enums\MachineStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Services\MachineService;
use InvalidArgumentException;
use Exception;

class MachinesController extends Controller
{
    public function __construct(private readonly MachineService $machineService)
    {
    }

    public function moderatorIndex(Request $request)
    {
        $perPage = (int) $request->get('perPage', 15);
        $machines = $this->machineService->getAllMachines($perPage);
        //dd($machines);
        return Inertia::render('moderator/machines/index', [
            'machines' => $machines,
        ]);
    }

    public function create()
    {
        return Inertia::render('moderator/machines/create', [
            'departments' => Department::select('id','name')->get(),
            'users' => User::select('id','name')->get(),
            'machine_statuses' => array_map(fn($c) => $c->value, MachineStatus::cases()),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_number' => 'required|string|unique:machines,serial_number',
            'year_of_production' => 'nullable|integer',
            'description' => 'nullable|string',
            'status' => 'required|string',
            'department_id' => 'nullable|exists:departments,id',
            'user_id' => 'nullable|exists:users,id',
            'barcode' => 'nullable|string|max:13',
            'last_failure_date' => 'nullable|date',
            'image' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('machines', 'public');
        }

        $this->machineService->createMachine($data);

        return redirect()->route('moderator.machines.machines.index')->with('success', 'Maszyna dodana.');
    }

    public function edit(int $id)
    {
        $machine = $this->machineService->getMachineById($id);

        return Inertia::render('moderator/machines/edit', [
            'machine' => $machine,
            'departments' => Department::select('id','name')->get(),
            'users' => User::select('id','name')->get(),
            'machine_statuses' => array_map(fn($c) => $c->value, MachineStatus::cases()),
        ]);
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_number' => "required|string|unique:machines,serial_number,{$id}",
            'year_of_production' => 'nullable|integer',
            'description' => 'nullable|string',
            'status' => 'required|string',
            'department_id' => 'nullable|exists:departments,id',
            'user_id' => 'nullable|exists:users,id',
            'barcode' => 'nullable|string|max:13',
            'last_failure_date' => 'nullable|date',
            'image' => 'nullable|image|max:5120',
        ]);

        // jeśli nowy obrazek — zapisz i usuń stary
        if ($request->hasFile('image')) {
            $machine = $this->machineService->getMachineById($id);
            if (!empty($machine->image_path)) {
                Storage::disk('public')->delete($machine->image_path);
            }
            $data['image_path'] = $request->file('image')->store('machines', 'public');
        }

        $this->machineService->updateMachine($id, $data);

        return redirect()->route('moderator.machines.machines.index')->with('success', 'Maszyna zaktualizowana.');
    }

    public function destroy(int $id)
    {
        try {
            $this->machineService->deleteMachine($id);
            return redirect()->route('moderator.machines.machines.index')->with('success', 'Maszyna usunięta.');
        } catch (InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        } catch (Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Wystąpił błąd podczas usuwania maszyny.']);
        }
    }

    public function getUserMachines()
    {
        $allMachines = $this->machineService->getUserMachines(auth()->id(), 15);
     //  dd($allMachines);
        return Inertia::render('machines/user-machines', [
            'machines' => $allMachines,
        ]);
    }

   
}
