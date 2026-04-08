import Barcode from 'react-barcode';
import { Link, router } from '@inertiajs/react';

type OrderForPlanning = {
    id: number;
    barcode?: string | null;
    customer_name: string;
    status: string;
    planned_production_at?: string | null;
    finished_at?: string | null;
    items_count?: number;
};

type PlaningCanbanCardProps = {
    title?: string;
    orders?: {
        data?: OrderForPlanning[];
        current_page?: number;
        last_page?: number;
        per_page?: number;
        total?: number;
        links?: Array<{ url: string | null; label: string; active: boolean }>;
    };
};

const STATUS_LABELS: Record<string, string> = {
    accepted: 'Accepted',
    in_progress: 'In Progress',
};

const fmt = (val?: string | null) => (val ? val : '-');

export default function PlaningCanbanCard({ orders, title = 'Tworzenie zlecenia produkcji' }: PlaningCanbanCardProps) {
    const list = orders?.data ?? [];

    const handleDelete = (id: number) => {
        if (!window.confirm('Czy na pewno chcesz usunąć zamówienie?')) return;
        router.delete(`/moderator/orders/${id}`);
    };

    const handleReject = (id: number) => {
        if (!window.confirm('Czy na pewno chcesz odrzucić zamówienie?')) return;
        router.post(`/moderator/orders/${id}/reject`);
    };

    return (
        <div className="bg-white rounded shadow p-4">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            {list.length === 0 ? (
                <p className="text-sm text-gray-700">Brak zamówień.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nazwa klienta</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data rozpoczęcia produkcji</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data zakończenia planowa</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ilość przedmiotów</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Akcje</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {list.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <div className="inline-flex flex-col items-center border rounded px-2 py-1">
                                            <Barcode value={String(order.barcode ?? order.id)} format="CODE128" width={1} height={32} displayValue={false} />
                                            <span className="text-[10px] text-gray-600 mt-1">{order.barcode ?? '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap">{order.customer_name}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{fmt(order.planned_production_at)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{fmt(order.finished_at)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{order.items_count ?? 0}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{STATUS_LABELS[order.status] ?? order.status}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/moderator/production/planning/orders/${order.id}/schema`} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Pokaż schemat</Link>
                                            <Link href={`/moderator/orders/${order.id}/add-item`} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Edycja</Link>
                                            <button onClick={() => handleDelete(order.id)} className="text-xs px-2 py-1 border rounded text-red-600 hover:bg-red-50">Usuń</button>
                                            <button onClick={() => handleReject(order.id)} className="text-xs px-2 py-1 border rounded text-amber-700 hover:bg-amber-50">Odrzuć</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Strona {orders?.current_page ?? 1} z {orders?.last_page ?? 1} — {orders?.total ?? list.length} wyników
                        </div>
                        <div className="flex items-center gap-1">
                            {(orders?.links ?? []).map((link, idx) => {
                                const isDisabled = !link.url;
                                const label = link.label
                                    .replace('&laquo; Previous', 'Poprzednia')
                                    .replace('Next &raquo;', 'Następna')
                                    .replace('&amp;', '&');

                                return (
                                    <Link
                                        key={`${label}-${idx}`}
                                        href={link.url ?? '#'}
                                        className={`px-2 py-1 border rounded text-xs ${
                                            link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'
                                        } ${isDisabled ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}
                                        dangerouslySetInnerHTML={{ __html: label }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
