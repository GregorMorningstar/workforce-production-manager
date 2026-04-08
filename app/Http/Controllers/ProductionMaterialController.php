<?php

namespace App\Http\Controllers;

use App\Enums\MaterialGroup;
use App\Enums\MaterialForm;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class ProductionMaterialController extends Controller
{


    public function __construct(private readonly \App\Services\Contracts\ProductionMaterialServiceInterface $productionMaterialService)
    {
    }

    public function index(\Illuminate\Http\Request $request)
    {
        $perPage = (int) $request->get('per_page', 15);

        $filters = [
            'name' => $request->get('name'),
            'barcode' => $request->get('barcode'),
            'group_material' => $request->get('group'),
            'availability' => $request->get('availability'),
            'search' => $request->get('q'),
        ];

        // remove null values
        $filters = array_filter($filters, function ($v) {
            return $v !== null && $v !== '';
        });

        $material = $this->productionMaterialService->paginate($perPage, $filters);

        // map delivery_scan to public url for each material item
        $material->getCollection()->transform(function ($m) {
            if (!empty($m->delivery_scan)) {
                $m->delivery_scan = Storage::url($m->delivery_scan);
            }
            return $m;
        });

        return Inertia::render('moderator/product_material/index', [
            'material' => $material,
            'filters' => $filters,
            'materialGroups' => MaterialGroup::toArray(),
            'materialForms' => MaterialForm::toArray(),
        ]);
    }

    public function create()
    {
        return response()->json([
            'materialGroups' => MaterialGroup::toArray(),
            'materialForms' => MaterialForm::toArray(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'group_material' => 'required|string|in:' . implode(',', MaterialGroup::values()),
            'material_form' => 'required|string|in:' . implode(',', MaterialForm::values()),
            'delivery_scan' => 'required|file|mimes:jpeg,jpg,png,pdf|max:10240',
            'delivery_number' => 'required|string|max:255',
            'stock_empty_alarm' => 'nullable|integer|min:0',
            'available_quantity' => 'nullable|numeric|min:0',
        ]);

        try {
            // Handle file upload
            if ($request->hasFile('delivery_scan')) {
                $file = $request->file('delivery_scan');
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('delivery_scans', $filename, 'public');
                $validated['delivery_scan'] = $path;
            }

            $material = $this->productionMaterialService->create($validated);

            if (!empty($material->delivery_scan)) {
                $material->delivery_scan = Storage::url($material->delivery_scan);
            }

            return response()->json([
                'success' => true,
                'message' => 'Materiał został dodany pomyślnie.',
                'material' => $material,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd podczas dodawania materiału: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lightweight API to create a material with minimal fields for quick usage in forms.
     * Accepts: name, material_form, group_material (optional), description (optional)
     * Returns JSON { success: true, material }
     */
    public function quickStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'material_form' => 'required|string|in:' . implode(',', MaterialForm::values()),
            'group_material' => 'nullable|string',
            'description' => 'nullable|string|max:500',
        ]);

        try {
            $data = array_merge($validated, [
                // minimal defaults required by service
                'delivery_number' => '-',
                'delivery_scan' => null,
                'stock_empty_alarm' => 0,
                'available_quantity' => 0,
            ]);

            $material = $this->productionMaterialService->create($data);

            if (!empty($material->delivery_scan)) {
                $material->delivery_scan = Storage::url($material->delivery_scan);
            }

            return response()->json([
                'success' => true,
                'material' => $material,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Błąd: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function addQuantity(Request $request, int $id)
    {
        $request->validate([
            'quantity' => 'required|numeric|min:0.01',
            'reason' => 'nullable|string|max:255',
            'delivery_number' => 'nullable|string|max:255',
            'delivery_scan' => 'nullable|file|mimes:jpeg,jpg,png,pdf|max:10240',
        ]);

        try {
            $deliveryPath = null;
            if ($request->hasFile('delivery_scan')) {
                $file = $request->file('delivery_scan');
                $filename = time() . '_' . $file->getClientOriginalName();
                $deliveryPath = $file->storeAs('delivery_scans', $filename, 'public');
            }

            $material = $this->productionMaterialService->addQuantity(
                $id,
                (float) $request->quantity,
                $request->reason,
                auth()->id(),
                $request->delivery_number ?? null,
                $deliveryPath
            );

            if (!$material) {
                return redirect()->back()->with('error', 'Materiał nie został znaleziony.');
            }

            return redirect()->back()->with('success', 'Ilość materiału została dodana.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function subtractQuantity(Request $request, int $id)
    {
        $request->validate([
            'quantity' => 'required|numeric|min:0.01',
            'reason' => 'nullable|string|max:255',
        ]);

        try {
            $material = $this->productionMaterialService->subtractQuantity(
                $id,
                (float) $request->quantity,
                $request->reason,
                auth()->id()
            );

            if (!$material) {
                return redirect()->back()->with('error', 'Materiał nie został znaleziony.');
            }

            return redirect()->back()->with('success', 'Ilość materiału została odjęta.');
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function history(Request $request, int $id)
    {
        $material = $this->productionMaterialService->find($id);

        if (!$material) {
            return redirect()->route('moderator.production-materials.index')
                ->with('error', 'Materiał nie został znaleziony.');
        }

        $perPage = (int) $request->get('per_page', 10);

        $filters = [
            'type' => $request->get('type'),
            'date_from' => $request->get('date_from'),
            'date_to' => $request->get('date_to'),
        ];

        $filters = array_filter($filters, fn($v) => $v !== null && $v !== '');

        $transactions = $this->productionMaterialService->getHistory($id, $perPage, $filters);

        // convert delivery_scan to public url for transactions and material
        if (!empty($material->delivery_scan)) {
            $material->delivery_scan = Storage::url($material->delivery_scan);
        }
        $transactions->getCollection()->transform(function ($t) {
            if (!empty($t->delivery_scan)) {
                $t->delivery_scan = Storage::url($t->delivery_scan);
            }
            return $t;
        });

        return Inertia::render('moderator/product_material/history', [
            'material' => $material,
            'transactions' => $transactions,
            'filters' => $filters,
        ]);
    }

    public function allHistory(Request $request)
    {
        $perPage = (int) $request->get('per_page', 10);

        $filters = [
            'search' => $request->get('search'),
            'type' => $request->get('type'),
            'date_from' => $request->get('date_from'),
            'date_to' => $request->get('date_to'),
        ];

        $filters = array_filter($filters, fn($v) => $v !== null && $v !== '');

        $transactions = $this->productionMaterialService->getAllTransactions($perPage, $filters);

        // Map delivery_scan to public url for each transaction and nested material
        $transactions->getCollection()->transform(function ($t) {
            if (!empty($t->delivery_scan)) {
                $t->delivery_scan = Storage::url($t->delivery_scan);
            }
            if (!empty($t->production_material) && !empty($t->production_material->delivery_scan)) {
                $t->production_material->delivery_scan = Storage::url($t->production_material->delivery_scan);
            }
            return $t;
        });

        return response()->json([
            'transactions' => $transactions,
            'filters' => $filters,
        ]);
    }
}
