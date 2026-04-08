<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\Contracts\ItemsFinishedGoodServiceInterface;
use Illuminate\Http\JsonResponse;


class ItemsFinishedGoodController extends Controller
{
     public function __construct(private readonly ItemsFinishedGoodServiceInterface $service)
     {
     }

     public function index()
     {
          $perPage = 10;
          $paginator = $this->service->paginate($perPage);
          $items = is_object($paginator) && method_exists($paginator, 'items') ? $paginator->items() : (array) $paginator;

          return Inertia::render('items/index', [
               'itemsFinishedGoods' => $items,
          ]);
     }

     public function create()
     {
           return Inertia::render('items/create');
     }

     public function store(Request $request)
     {
          $data = $request->validate([
               'name' => 'required|string|max:255',
               'description' => 'nullable|string',
               'price' => 'nullable|numeric',
               'stock' => 'nullable|integer',
               'time_of_production' => 'nullable|integer',
               'image' => 'nullable|file|image|max:5120',
          ]);

          if ($request->hasFile('image')) {
               $path = $request->file('image')->store('image', 'public');
               $data['image_path'] = 'storage/' . $path;
          }

          $item = $this->service->create($data);

          return redirect()->route('moderator.items.index');
     }

     public function update(Request $request, int $id): JsonResponse
     {
          $data = $request->only(['name', 'barcode', 'quantity', 'cost', 'price', 'stock']);

          if (isset($data['quantity']) && !isset($data['stock'])) {
               $data['stock'] = $data['quantity'];
               unset($data['quantity']);
          }
          if (isset($data['cost']) && !isset($data['price'])) {
               $data['price'] = $data['cost'];
               unset($data['cost']);
          }

          $item = $this->service->update($id, $data);
          if (!$item) {
               return response()->json(['message' => 'Not found'], 404);
          }

          return response()->json(['message' => 'Updated', 'item' => $item], 200);
     }

     public function destroy(int $id): JsonResponse
     {
          $deleted = $this->service->delete($id);
          if (!$deleted) {
               return response()->json(['message' => 'Not found or not deleted'], 404);
          }

          return response()->json(['message' => 'Deleted'], 200);
     }

     public function show(int $id)
     {
          $item = $this->service->find($id);
          if (!$item) {
               return redirect()->route('moderator.items.index');
          }

          return Inertia::render('items/show', [
               'item' => $item,
          ]);
     }

     public function edit(int $id)
     {
          $item = $this->service->find($id);
          if (!$item) {
               return redirect()->route('moderator.items.index');
          }

          return Inertia::render('items/create', [
               'item' => $item,
          ]);
     }

     public function processes(Request $request)
     {
          $perPage = (int) ($request->get('perPage', 15));
          $filters = [
               'name' => $request->get('name'),
               'barcode' => $request->get('barcode'),
          ];

          $paginator = $this->service
               ->getWithProcessSummaryPaginated($perPage, array_filter($filters, fn($v) => $v !== null && $v !== ''))
               ->withQueryString();

          return Inertia::render('items/processes', [
               'itemsFinishedGoods' => $paginator,
               'filters' => $filters,
          ]);
     }
}
