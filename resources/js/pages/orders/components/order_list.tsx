import React from 'react';
import { Link, router } from '@inertiajs/react';
import ReactBarcode from 'react-barcode';

type Order = {
    id: number;
    name: string;
    status: string;
    created_at: string;
    barcode?: string | number | null;
    barcode_value?: string | number | null;
    client_name?: string | null;
    title?: string | null;
    client?: {
        name: string;
    };
    customer_name?: string | null;
    received_at?: string | null;
    planned_production_at?: string | null;
    finished_at?: string | null;
    real_finished_at?: string | null;
    description?: string | null;
};

type OrderListProps = {
    orders?: any;
};

export default function OrderList({ orders }: OrderListProps) {
    // Normalize orders to list + paginated metadata (supports array, legacy Inertia paginator, or new API shape)
    const raw = orders ?? [];
    const isLegacy = raw && typeof raw === 'object' && Array.isArray((raw as any).data);
    const isNew = raw && typeof raw === 'object' && Array.isArray((raw as any).items);

    const list: Order[] = isLegacy ? (raw as any).data : isNew ? (raw as any).items : (Array.isArray(raw) ? raw : []);

    const paginated = isLegacy
        ? (raw as any)
        : isNew
        ? {
              data: (raw as any).items,
              current_page: (raw as any).pagination?.current_page ?? 1,
              last_page: (raw as any).pagination?.last_page ?? 1,
              per_page: (raw as any).pagination?.per_page ?? (raw as any).pagination?.perPage ?? 15,
              total: (raw as any).pagination?.total ?? 0,
              path: (raw as any).pagination?.path ?? window.location.pathname,
          }
        : null;

    const hasActiveOrders = list.length > 0;

    if (!hasActiveOrders) {
        return (
            <div>
                <div>Brak zamówień.</div>
                <a href="/orders/create">
                    <button>Wprowadź zamówienie</button>
                </a>
            </div>
        );
    }

    const handleDelete = (id: number) => {
        if (!confirm('Czy na pewno chcesz usunąć zamówienie?')) return;
        router.delete(`/orders/${id}`, {
            onSuccess: () => location.reload(),
            onError: (err: any) => {
                alert('Usuwanie nie powiodło się.');
                // eslint-disable-next-line no-console
                console.error(err);
            },
        });
    };

    const basePath = paginated?.path ?? window.location.pathname;

    const qsFromState = (page: number) => {
        const usp = new URLSearchParams(window.location.search);
        usp.set('page', String(page));
        return usp.toString() ? `?${usp.toString()}` : '';
    };

    return (
        <div className="overflow-x-auto bg-white rounded shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nazwa klienta</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kod kreskowy</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data przyjęcia</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planowany czas produkcji</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planowany czas zakończenia</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rzeczywisty czas zakończenia</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opis</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {list.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{order.customer_name ?? order.client_name ?? order.client?.name ?? '-'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 p-2 bg-white rounded border transform hover:-translate-y-1 transition-transform">
                                        {/* @ts-ignore react-barcode */}
                                        <ReactBarcode value={String(order.barcode ?? order.barcode_value ?? order.id)} format="CODE128" renderer="svg" height={44} width={1} displayValue={false} />
                                        <div className="mt-1 text-xs text-gray-600 text-center">{order.barcode ?? order.barcode_value ?? '-'}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{order.status ?? '-'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{order.received_at ?? order.created_at ?? '-'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{order.planned_production_at ?? '-'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{order.finished_at ?? '-'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{order.real_finished_at ?? '-'}</td>
                            <td className="px-3 py-2 whitespace-normal text-sm text-gray-700 max-w-md break-words" title={order.description ?? ''}>{order.description ? (String(order.description).length > 120 ? String(order.description).slice(0, 120) + '...' : order.description) : '-'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center gap-2">
                                    <Link href={`/moderator/orders/${order.id}`} className="px-2 py-1 bg-white border rounded text-indigo-600 hover:bg-indigo-50 text-xs">Szczegóły</Link>
                                    <Link href={`/moderator/orders/${order.id}/edit`} className="px-2 py-1 bg-white border rounded text-gray-600 hover:bg-gray-50 text-xs">Edytuj</Link>
                                    <button onClick={() => handleDelete(order.id)} className="px-2 py-1 bg-white border rounded text-red-600 hover:bg-red-50 text-xs">Usuń</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {paginated && (
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-700">Strona {paginated.current_page} z {paginated.last_page} — {paginated.total} wyników</div>
                    <nav className="inline-flex -space-x-px" aria-label="Pagination">
                        {paginated.current_page > 1 ? (
                            <Link href={`${basePath}${qsFromState(paginated.current_page - 1)}`} className="px-2 py-1 border bg-white text-xs text-gray-700">Poprzednia</Link>
                        ) : (
                            <span className="px-2 py-1 border bg-gray-100 text-xs text-gray-400">Poprzednia</span>
                        )}

                        {Array.from({ length: paginated.last_page }).map((_, i) => {
                            const page = i + 1;
                            const isCurrent = page === paginated.current_page;
                            return (
                                <Link
                                    key={page}
                                    href={`${basePath}${qsFromState(page)}`}
                                    className={`px-2 py-1 border text-xs ${isCurrent ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
                                >
                                    {page}
                                </Link>
                            );
                        })}

                        {paginated.current_page < paginated.last_page ? (
                            <Link href={`${basePath}${qsFromState(paginated.current_page + 1)}`} className="px-2 py-1 border bg-white text-xs text-gray-700">Następna</Link>
                        ) : (
                            <span className="px-2 py-1 border bg-gray-100 text-xs text-gray-400">Następna</span>
                        )}
                    </nav>
                </div>
            )}
        </div>
    );
}
