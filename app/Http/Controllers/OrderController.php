<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\OrderItem;
use App\Enums\OrderStatus;
use App\Services\Contracts\OrderServiceInterface;
use App\Services\Contracts\ItemsFinishedGoodServiceInterface;

class OrderController extends Controller
{

public function __construct(private readonly OrderServiceInterface $orderService,
                            private readonly ItemsFinishedGoodServiceInterface $itemsFinishedGoodService
)
    {

    }


public function index(Request $request)
    {

$order = $this->orderService->getActiveOrdersPaginated(15, $request->all());
//dd($order);
     return Inertia::render('orders/index', [
            'orders' => $order



        ]);
    }

    public function create()
    {
        return Inertia::render('orders/create');
    }

    public function show($id)
    {
        $order = $this->orderService->find($id);
        if (!$order) {
            abort(404, 'Zamówienie nie znalezione');
        }
        // Pobierz produkty zamówienia
        $items = $order->items()->with('product')->get();

        // also provide available products and already added products so the drag & drop panel can render inline
        $products = $this->itemsFinishedGoodService->paginate(100, []);

        $addedProducts = $order->items()
            ->with('product')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'items_finished_good_id' => $item->items_finished_good_id,
                    'name' => $item->product?->name,
                    'quantity' => $item->quantity,
                ];
            })
            ->values();

        return Inertia::render('orderItems/show', [
            'order' => $order,
            'items' => $items,
            'addedProducts' => $addedProducts,
            'availableProducts' => $products->items(),
        ]);
    }
    public function store(Request $request)
    {


        $validatedData = $request->validate([
            'customer_name' => 'required|string|max:255',
            'planned_production_at' => 'nullable|string|max:20',
            'finished_at' => 'nullable|string|max:20',
            'description' => 'nullable|string|max:255',
        ]);
    //dd($validatedData);
        $order = $this->orderService->create($validatedData);

        // Po utworzeniu zamówienia przekieruj na stronę szczegółów zamówienia
        return redirect()->route('moderator.orders.show', ['id' => $order->id])->with('success', 'Zamówienie zostało utworzone pomyślnie.');
    }

    public function addItem($id)
    {
        $order = $this->orderService->find($id);
        $products = $this->itemsFinishedGoodService->paginate(100, []);
        if (!$order) {
            abort(404, 'Zamówienie nie znalezione');
        }

        $addedProducts = $order->items()
            ->with('product')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'items_finished_good_id' => $item->items_finished_good_id,
                    'name' => $item->product?->name,
                    'quantity' => $item->quantity,
                ];
            })
            ->values();

        return Inertia::render('orderItems/item/create-one-items', [
            'order' => $order,
            'addedProducts' => $addedProducts,
            'availableProducts' => $products->items(),
        ]);
    }

    public function storeItems(Request $request, $id)
    {
        $order = $this->orderService->find($id);
        if (!$order) {
            abort(404, 'Zamówienie nie znalezione');
        }

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.items_finished_good_id' => ['required', 'integer', 'exists:items_finished_goods,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        foreach ($validated['items'] as $itemData) {
            $orderItem = OrderItem::firstOrNew([
                'order_id' => $order->id,
                'items_finished_good_id' => $itemData['items_finished_good_id'],
            ]);

            $orderItem->quantity = (int) $itemData['quantity'];
            $orderItem->save();
        }

        return redirect()
            ->route('moderator.orders.add_item', ['id' => $order->id])
            ->with('success', 'Zamówienie zostało uzupełnione.');
    }

    public function destroy(int $id)
    {
        $order = $this->orderService->find($id);
        if (!$order) {
            abort(404, 'Zamówienie nie znalezione');
        }

        $order->items()->delete();
        $this->orderService->delete($id);

        return redirect()->back()->with('success', 'Zamówienie zostało usunięte.');
    }

    public function reject(int $id)
    {
        $order = $this->orderService->find($id);
        if (!$order) {
            abort(404, 'Zamówienie nie znalezione');
        }

        $this->orderService->update($id, ['status' => OrderStatus::REJECTED->value]);

        return redirect()->back()->with('success', 'Zamówienie zostało odrzucone.');
    }
//sold items ready ordered
    public function soldItems(Request $request)
    {
        return Inertia::render('orders/sell-items-history', []);
    }
}
