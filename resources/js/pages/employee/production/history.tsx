import React from 'react';
import { Link } from '@inertiajs/react';
import EmployeeLayout from '@/layouts/EmployeeLayout';

type PlanRow = {
    id: number;
    barcode?: string | null;
    status: string;
    planned_start_at?: string | null;
    planned_end_at?: string | null;
    order_quantity?: number | null;
    order?: { id: number; barcode?: string | null; customer_name?: string | null } | null;
    item?: { id: number; name?: string | null } | null;
    operation?: { id: number; operation_name?: string | null } | null;
    machine?: { id: number; name?: string | null } | null;
};

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    plans: Paginated<PlanRow>;
};

const fmt = (value?: string | null) => value || '-';

export default function EmployeeProductionHistory({ plans }: Props) {
    const breadcrumbs = [
        { label: 'Home', href: '/employee/dashboard' },
        { label: 'Produkcja', href: '/employee/production/my' },
        { label: 'Historia', href: '#' },
    ];

    return (
        <EmployeeLayout breadcrumbs={breadcrumbs} title="Historia produkcji">
            <div className="bg-white rounded shadow p-4">
                <h2 className="text-lg font-semibold mb-3">Historia pracownika</h2>

                {plans.data.length === 0 ? (
                    <p className="text-sm text-gray-600">Brak historii prac produkcyjnych.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Zamówienie</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produkt</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Operacja</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Maszyna</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ilość</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Koniec</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {plans.data.map((plan) => (
                                    <tr key={plan.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2">{plan.barcode ?? '-'}</td>
                                        <td className="px-3 py-2">{plan.order?.barcode ?? '-'}</td>
                                        <td className="px-3 py-2">{plan.item?.name ?? '-'}</td>
                                        <td className="px-3 py-2">{plan.operation?.operation_name ?? '-'}</td>
                                        <td className="px-3 py-2">{plan.machine?.name ?? '-'}</td>
                                        <td className="px-3 py-2">{plan.order_quantity ?? 0}</td>
                                        <td className="px-3 py-2">{plan.status}</td>
                                        <td className="px-3 py-2">{fmt(plan.planned_end_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                        Strona {plans.current_page} z {plans.last_page} — {plans.total} wyników
                    </div>
                    <div className="flex items-center gap-1">
                        {plans.links.map((link, idx) => {
                            const label = link.label
                                .replace('&laquo; Previous', 'Poprzednia')
                                .replace('Next &raquo;', 'Następna')
                                .replace('&amp;', '&');

                            return (
                                <Link
                                    key={`${label}-${idx}`}
                                    href={link.url ?? '#'}
                                    className={`px-2 py-1 border rounded text-xs ${link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'} ${!link.url ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}
                                    dangerouslySetInnerHTML={{ __html: label }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}
