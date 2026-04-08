import React from 'react';
import { router } from '@inertiajs/react';

interface Failure {
    id: number;
    barcode?: string | null;
    machine?: { name?: string | null, barcode?: string | null } | null;
    failure_description?: string | null;
    reported_at?: string | null;
    finished_repaired_at?: string | null;
    total_cost?: number | null;
}

export default function HistoryRepairedList({ history = { items: [], pagination: {} }, filters = {} }: any) {
    const items: Failure[] = history.items ?? [];
    const pagination = history.pagination ?? {};

    const goPage = (page: number) => {
        const params = { ...filters, page };
        router.get(window.location.pathname, params, { preserveState: true, replace: true });
    };

    return (
        <div>
            <div className="overflow-x-auto bg-white shadow rounded">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Barcode</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Maszyna</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Zgłoszono</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Naprawiono</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Koszt (PLN)</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Opis</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((f) => (
                            <tr key={f.id}>
                                <td className="px-4 py-3 text-sm font-mono">{f.machine?.barcode ?? f.barcode ?? '-'}</td>
                                <td className="px-4 py-3 text-sm">{f.machine?.name ?? '-'}</td>
                                <td className="px-4 py-3 text-sm">{f.reported_at ?? '-'}</td>
                                <td className="px-4 py-3 text-sm">{f.finished_repaired_at ?? '-'}</td>
                                <td className="px-4 py-3 text-sm text-right">{(f.total_cost ?? 0).toFixed(2)} zł</td>
                                <td className="px-4 py-3 text-sm">{String(f.failure_description ?? '').slice(0, 100)}{(f.failure_description ?? '').length > 100 ? '...' : ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">Strona {pagination.current_page ?? 1} z {pagination.last_page ?? 1}</div>
                <div className="flex items-center gap-2">
                    <button disabled={(pagination.current_page ?? 1) <= 1} onClick={() => goPage((pagination.current_page ?? 1) - 1)} className="px-3 py-1 bg-gray-100 rounded">Poprzednia</button>
                    <button disabled={(pagination.current_page ?? 1) >= (pagination.last_page ?? 1)} onClick={() => goPage((pagination.current_page ?? 1) + 1)} className="px-3 py-1 bg-gray-100 rounded">Następna</button>
                </div>
            </div>
        </div>
    );
}
