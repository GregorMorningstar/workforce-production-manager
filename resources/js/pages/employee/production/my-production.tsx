import React, { useEffect, useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import Barcode from 'react-barcode';

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
    machine?: { id: number; name?: string | null; barcode?: string | null } | null;
};

type OperationOption = {
    id: number;
    name: string;
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

const fmtDate = (value?: string | null): string => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
};

export default function EmployeeMyProduction({ plans }: Props) {
    const page = usePage();
    const [activePlanId, setActivePlanId] = useState<number | null>(null);
    const [machineBarcode, setMachineBarcode] = useState<string>('');
    const [operations, setOperations] = useState<OperationOption[]>([]);
    const [selectedOperationId, setSelectedOperationId] = useState<string>('');
    const [scanError, setScanError] = useState<string>('');
    const [isLoadingOps, setIsLoadingOps] = useState<boolean>(false);

    const queryMachineBarcode = useMemo(() => {
        const url = ((page as any).url ?? '') as string;
        const idx = url.indexOf('?');
        if (idx < 0) return '';
        const params = new URLSearchParams(url.substring(idx + 1));
        return params.get('machine_barcode') ?? '';
    }, [(page as any).url]);

    useEffect(() => {
        if (!queryMachineBarcode || plans.data.length === 0) return;

        const matchingPlan = plans.data.find((plan) => plan.machine?.barcode === queryMachineBarcode);
        if (!matchingPlan) return;

        setActivePlanId(matchingPlan.id);
        setMachineBarcode(queryMachineBarcode);
    }, [queryMachineBarcode, plans.data]);

    const breadcrumbs = [
        { label: 'Home', href: '/employee/dashboard' },
        { label: 'Produkcja', href: '/employee/production/my' },
        { label: 'Moja produkcja', href: '#' },
    ];

    const openStartPanel = (planId: number) => {
        setActivePlanId(planId);
        setMachineBarcode('');
        setOperations([]);
        setSelectedOperationId('');
        setScanError('');
    };

    const handleScanMachine = async (planId: number) => {
        if (!machineBarcode) {
            setScanError('Wpisz kod kreskowy maszyny.');
            return;
        }

        setIsLoadingOps(true);
        setScanError('');

        try {
            const response = await fetch(`/employee/production/${planId}/machine-operations?machine_barcode=${encodeURIComponent(machineBarcode)}`);
            const payload = await response.json();

            if (!response.ok) {
                setOperations([]);
                setSelectedOperationId('');
                setScanError(payload?.message ?? 'Nie udało się pobrać operacji.');
                return;
            }

            const fetchedOps: OperationOption[] = Array.isArray(payload?.operations) ? payload.operations : [];
            setOperations(fetchedOps);
            setSelectedOperationId(payload?.default_operation_id ? String(payload.default_operation_id) : fetchedOps[0] ? String(fetchedOps[0].id) : '');
        } catch {
            setOperations([]);
            setSelectedOperationId('');
            setScanError('Błąd połączenia podczas pobierania operacji.');
        } finally {
            setIsLoadingOps(false);
        }
    };

    const handleStartProduction = (planId: number) => {
        if (!machineBarcode || !selectedOperationId) {
            setScanError('Zeskanuj maszynę i wybierz operację.');
            return;
        }

        router.post(
            `/employee/production/${planId}/start`,
            {
                machine_barcode: machineBarcode,
                operationmachine_id: Number(selectedOperationId),
            },
            {
                onSuccess: () => {
                    window.open(`/employee/production/${planId}/workbench`, '_blank');
                },
            }
        );
    };

    return (
        <EmployeeLayout breadcrumbs={breadcrumbs} title="Moja produkcja">
            <div className="bg-white rounded shadow p-4">
                <h2 className="text-lg font-semibold mb-3">Moja produkcja</h2>

                {plans.data.length === 0 ? (
                    <p className="text-sm text-gray-600">Brak aktywnych zadań produkcyjnych.</p>
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
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Barcode maszyny</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ilość</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Akcje</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {plans.data.map((plan) => (
                                    <React.Fragment key={plan.id}>
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-3 py-2">{plan.barcode ?? '-'}</td>
                                            <td className="px-3 py-2">
                                                <div className="inline-flex flex-col items-center">
                                                    <Barcode value={String(plan.order?.barcode ?? '0')} format="CODE128" width={1.2} height={32} displayValue={false} margin={2} />
                                                    <span className="text-[10px] font-mono text-gray-600">{plan.order?.barcode ?? '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">{plan.item?.name ?? '-'}</td>
                                            <td className="px-3 py-2">{plan.operation?.operation_name ?? '-'}</td>
                                            <td className="px-3 py-2">{plan.machine?.name ?? '-'}</td>
                                            <td className="px-3 py-2">
                                                <div className="inline-flex flex-col items-center">
                                                    <Barcode value={String(plan.machine?.barcode ?? '0')} format="CODE128" width={1.2} height={32} displayValue={false} margin={2} />
                                                    <span className="text-[10px] font-mono text-gray-600">{plan.machine?.barcode ?? '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">{plan.order_quantity ?? 0}</td>
                                            <td className="px-3 py-2">{plan.status}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{fmtDate(plan.planned_start_at)}</td>
                                            <td className="px-3 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openStartPanel(plan.id)}
                                                    className="px-2 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700"
                                                >
                                                    Rozpocznij produkcję
                                                </button>
                                            </td>
                                        </tr>

                                        {activePlanId === plan.id && (
                                            <tr>
                                                <td colSpan={11} className="px-3 py-3 bg-indigo-50">
                                                    <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
                                                        <div className="flex-1 min-w-[260px]">
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Zeskanuj / wpisz barcode maszyny
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={machineBarcode}
                                                                onChange={(e) => setMachineBarcode(e.target.value)}
                                                                placeholder="np. 3000000000001"
                                                                className="w-full border rounded px-2 py-1 text-sm"
                                                            />
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleScanMachine(plan.id)}
                                                            className="px-3 py-2 text-sm rounded border hover:bg-white"
                                                            disabled={isLoadingOps}
                                                        >
                                                            {isLoadingOps ? 'Pobieranie...' : 'Pobierz operacje'}
                                                        </button>

                                                        <div className="flex-1 min-w-[260px]">
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Wybór dostępnej operacji
                                                            </label>
                                                            <select
                                                                value={selectedOperationId}
                                                                onChange={(e) => setSelectedOperationId(e.target.value)}
                                                                className="w-full border rounded px-2 py-1 text-sm"
                                                            >
                                                                <option value="">Wybierz operację</option>
                                                                {operations.map((operation) => (
                                                                    <option key={operation.id} value={operation.id}>
                                                                        {operation.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartProduction(plan.id)}
                                                            className="px-3 py-2 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700"
                                                        >
                                                            Start
                                                        </button>
                                                    </div>

                                                    {!!scanError && (
                                                        <p className="mt-2 text-sm text-red-600">{scanError}</p>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
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
