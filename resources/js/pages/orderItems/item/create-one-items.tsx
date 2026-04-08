import ModeratorLayout from '@/layouts/ModeratorLayout';
import OrderHeaderItem from '../component/order-header-item';
import { Link, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';

type Product = {
  id: number;
  name: string;
};

type Added = {
  items_finished_good_id: number;
  name?: string;
  quantity?: number;
};

type SelectedItem = {
  productId: number;
  name: string;
  quantity: number;
};

type Props = {
  order: any;
  addedProducts: Added[];
  availableProducts: Product[];
  embedded?: boolean;
  showAvailableProducts?: boolean;
  readOnly?: boolean;
};


export default function CreateOneItems(props: Props) {
  const {
    order,
    addedProducts = [],
    availableProducts = [],
    embedded = false,
    showAvailableProducts = true,
    readOnly = false,
  } = props;
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>(
    (Array.isArray(addedProducts) ? addedProducts : []).map((item) => ({
      productId: Number(item.items_finished_good_id),
      name: item.name || `Produkt #${item.items_finished_good_id}`,
      quantity: Number(item.quantity || 1),
    })),
  );

  const addOrIncreaseItem = useCallback((product: Product) => {
    setSelectedItems((prev) => {
      const exists = prev.find((item) => item.productId === product.id);
      if (exists) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [...prev, { productId: product.id, name: product.name, quantity: 1 }];
    });
  }, []);

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, product: Product) => {
    if (readOnly) return;
    event.dataTransfer.setData('application/reactflow', JSON.stringify(product));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (readOnly) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (readOnly) return;
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/reactflow');
    if (!raw) return;

    const product = JSON.parse(raw) as Product;
    addOrIncreaseItem(product);
  };

  const setQuantity = (productId: number, quantityValue: number) => {
    const safeQuantity = Number.isFinite(quantityValue) ? Math.max(1, Math.floor(quantityValue)) : 1;
    setSelectedItems((prev) => prev.map((item) => (item.productId === productId ? { ...item, quantity: safeQuantity } : item)));
  };

  const removeItem = (productId: number) => {
    setSelectedItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const submitItems = () => {
    if (selectedItems.length === 0) {
      alert('Dodaj przynajmniej jeden produkt do zamówienia.');
      return;
    }

    router.post(`/moderator/orders/${order.id}/add-item`, {
      items: selectedItems.map((item) => ({
        items_finished_good_id: item.productId,
        quantity: item.quantity,
      })),
    });
  };

  const content = (
    <div className={showAvailableProducts ? 'grid grid-cols-1 gap-6 lg:grid-cols-3' : 'grid grid-cols-1 gap-6'}>
      <div className={`space-y-4 ${showAvailableProducts ? 'lg:col-span-2' : ''}`}>
          <h2 className="text-xl font-semibold">
            {readOnly ? 'Dodane produkty' : 'Dodane produkty (drag & drop)'}
          </h2>
          {/* React Flow grid removed; drops are handled on the order list below */}

          <div className="rounded border bg-white p-4" onDragOver={onDragOver} onDrop={onDrop}>
            <h3 className="mb-3 text-base font-semibold">Lista do zamówienia</h3>
            {selectedItems.length === 0 ? (
              <div className="text-sm text-gray-500">
                {readOnly ? 'Brak dodanych produktów.' : 'Przeciągnij produkt z prawej strony tutaj, aby dodać do listy.'}
              </div>
            ) : (
              <ul className="space-y-2">
                {selectedItems.map((item) => (
                  <li key={item.productId} className="flex flex-col gap-2 rounded border p-3 md:flex-row md:items-center md:justify-between">
                    <div className="font-medium">{item.name}</div>
                    {readOnly ? (
                      <div className="text-sm text-gray-700">Ilość: {item.quantity}</div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Ilość:</label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => setQuantity(item.productId, Number(e.target.value))}
                          className="w-24 rounded border px-2 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Usuń
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {!readOnly && (
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={submitItems}
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Uzupełnij zamówienie
                </button>
                <Link
                  href={`/moderator/orders/${order.id}`}
                  className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Wróć do szczegółów
                </Link>
              </div>
            )}
          </div>
      </div>

      {showAvailableProducts && !readOnly && (
        <div className="flex min-h-0 flex-col">
          <h2 className="mb-4 text-xl font-semibold">Dostępne przedmioty</h2>
          <div className="flex max-h-[620px] flex-col gap-2 overflow-y-auto pr-1">
            {availableProducts.map((product) => (
              <div
                key={product.id}
                draggable
                onDragStart={(event) => onDragStart(event, product)}
                className="block w-full cursor-grab rounded border bg-green-50 p-3 text-sm font-medium hover:bg-green-100 active:cursor-grabbing"
                title="Przeciągnij na obszar po lewej"
              >
                {product.name}
              </div>
            ))}
            {availableProducts.length === 0 && (
              <div className="rounded border bg-gray-50 p-3 text-sm text-gray-500">Brak dostępnych przedmiotów.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <ModeratorLayout title="Dodaj pozycję do zamówienia">
      <OrderHeaderItem order={order} />
      {content}
    </ModeratorLayout>
  );
}
