import React, { useEffect, useRef, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import Barcode from 'react-barcode';

type Failure = any;

export default function MachineFailureHistory({ history, filters }: { history?: Failure[] | any, filters?: any }) {
    // Normalize incoming `history` shapes to a consistent `dataRows` array and `paginated` metadata.
    // Supported shapes:
    // 1) Legacy Inertia paginator: { data: [...], current_page, last_page, per_page, total, path }
    // 2) New API shape: { items: [...], pagination: { current_page, last_page, per_page, total, path } }
    // 3) Plain array: [...]
    const raw = history ?? [];
    const isLegacyPaginator = raw && typeof raw === 'object' && Array.isArray((raw as any).data);
    const isNewShape = raw && typeof raw === 'object' && Array.isArray((raw as any).items);

    const dataRows: Failure[] = isLegacyPaginator ? (raw as any).data : (isNewShape ? (raw as any).items : (Array.isArray(raw) ? raw : []));

    const paginated = isLegacyPaginator ? (raw as any) : (isNewShape ? {
        // adapt new shape to legacy fields used by pagination rendering below
        data: (raw as any).items,
        current_page: (raw as any).pagination?.current_page ?? 1,
        last_page: (raw as any).pagination?.last_page ?? 1,
        per_page: (raw as any).pagination?.per_page ?? (raw as any).pagination?.perPage ?? 15,
        total: (raw as any).pagination?.total ?? 0,
        path: (raw as any).pagination?.path ?? window.location.pathname,
        prev_page_url: null,
        next_page_url: null,
    } : null);

    const initialFilters = filters ?? {};
    const [barcode, setBarcode] = useState(initialFilters.barcode ?? '');
    const [machineName, setMachineName] = useState(initialFilters.machine_name ?? '');
    const [dateFrom, setDateFrom] = useState(initialFilters.date_from ?? '');
    const [dateTo, setDateTo] = useState(initialFilters.date_to ?? '');
    const [perPage] = useState(initialFilters.per_page ?? (paginated?.per_page ?? 15));

    const debounceRef = useRef<number | null>(null);

    // Service list modal state
    const [repairsModalOpen, setRepairsModalOpen] = useState(false);
    const [repairsLoading, setRepairsLoading] = useState(false);
    const [repairsError, setRepairsError] = useState<string | null>(null);
    const [repairsList, setRepairsList] = useState<any[]>([]);

    const openServiceList = async (machineFailureId: number) => {
        setRepairsModalOpen(true);
        setRepairsLoading(true);
        setRepairsError(null);
        setRepairsList([]);
        try {
            const res = await fetch(`/machines/failures/${machineFailureId}/repairs`, { headers: { 'Accept': 'application/json' } });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setRepairsList(Array.isArray(json) ? json : (json.data ?? json.items ?? []));
        } catch (e: any) {
            setRepairsError(e?.message ?? 'Błąd pobierania listy');
        } finally {
            setRepairsLoading(false);
        }
    };

    const imgSrc = (path: string | null | undefined) => (path ? `/storage/${path}` : 'https://via.placeholder.com/120x90?text=Maszyna');
    const formatDateParts = (s: string | null | undefined) => {
        if (!s) return { date: '—', time: '' };
        try {
            const d = new Date(s);
            return { date: d.toLocaleDateString(), time: d.toLocaleTimeString() };
        } catch (e) {
            return { date: s, time: '' };
        }
    };

    const translateStatus = (s: string | null | undefined) => {
        if (!s) return '-';
        const map: Record<string, string> = {
            reported: 'Zgłoszony',
            repaired: 'Naprawiony',
            diagnosis: 'Diagnoza',
            waiting_for_parts: 'Oczekuje na części',
            rejected: 'Odrzucony',
            in_progress: 'W trakcie',
        };
        return map[String(s)] ?? String(s).charAt(0).toUpperCase() + String(s).slice(1);
    };

    const buildParams = (page?: number) => {
        const params: any = {};
        if (barcode) params.barcode = barcode;
        if (machineName) params.machine_name = machineName;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (perPage) params.per_page = perPage;
        if (page) params.page = page;
        return params;
    };

    const basePath = paginated?.path ?? window.location.pathname;

    const doSearch = (page?: number) => {
        const params = buildParams(page);
        router.get(basePath, params, { preserveState: true, replace: true, preserveScroll: true });
    };

    const scheduleSearch = (page?: number) => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => doSearch(page ?? 1), 450);
    };

    useEffect(() => {
        if (initialFilters && Object.keys(initialFilters).length > 0) {
            doSearch(paginated?.current_page ?? 1);
        }
    }, []);

    const qsFromState = (page: number) => {
        const params = buildParams(page);
        const usp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && String(v).length > 0) usp.append(k, String(v));
        });
        return usp.toString() ? `?${usp.toString()}` : '';
    };

    return (
        <div className="overflow-x-auto relative">
            <div className="mb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 flex-1">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                        <input value={barcode} onChange={(e) => { setBarcode(e.target.value); scheduleSearch(); }} placeholder="Szukaj po barcode" className="px-3 py-2 border rounded w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa maszyny</label>
                        <input value={machineName} onChange={(e) => { setMachineName(e.target.value); scheduleSearch(); }} placeholder="Szukaj po nazwie maszyny" className="px-3 py-2 border rounded w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Od</label>
                        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); scheduleSearch(); }} className="px-3 py-2 border rounded w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Do</label>
                        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); scheduleSearch(); }} className="px-3 py-2 border rounded w-full" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setBarcode('');
                            setMachineName('');
                            setDateFrom('');
                            setDateTo('');
                            if (debounceRef.current) window.clearTimeout(debounceRef.current);
                            doSearch(1);
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded"
                    >
                        Wyczyść
                    </button>
                </div>
            </div>

            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maszyna / Barcode</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zdjęcie</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data awarii</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data naprawy</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opis</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zgłaszający</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {dataRows.map((r: Failure) => {
                        const machine = r.machine ?? {};
                        const user = r.user ?? {};
                        return (
                            <tr key={r.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{r.id}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-36 p-2 bg-white rounded border flex flex-col items-center justify-center">
                                            <Barcode
                                                value={String(machine.barcode ?? r.id ?? '')}
                                                format="CODE128"
                                                renderer="svg"
                                                height={52}
                                                width={1.2}
                                                displayValue={false}
                                            />
                                            <div className="mt-1 text-sm md:text-base font-semibold text-gray-700 truncate">{machine.barcode ?? r.id}</div>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium text-sm text-gray-900 truncate">{machine.name ?? '—'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                    <img src={imgSrc(machine.image_path)} alt={machine.name ?? 'Maszyna'} className="h-12 w-20 object-cover rounded mx-auto" />
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                                    {(() => {
                                        const p = formatDateParts(r.reported_at);
                                        return (
                                            <div>
                                                <div>{p.date}</div>
                                                <div className="text-xs text-gray-500">{p.time}</div>
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                                    {(() => {
                                        const p = formatDateParts(r.finished_repaired_at);
                                        return (
                                            <div>
                                                <div>{p.date}</div>
                                                <div className="text-xs text-gray-500">{p.time}</div>
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td className="px-3 py-2 whitespace-normal text-sm text-gray-700 max-w-md break-words" title={r.failure_description ?? ''}>
                                    {r.failure_description ? (r.failure_description.length > 140 ? r.failure_description.slice(0, 140) + '...' : r.failure_description) : '—'}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{user.name ?? '—'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                // open service list modal for this failure
                                                openServiceList(r.id);
                                            }}
                                            className="px-2 py-1 bg-white border rounded text-indigo-600 hover:bg-indigo-50 text-xs"
                                        >
                                            Lista serwisowa
                                        </button>
                                        <Link href={`/machines/failures/edit/${r.id}`} className="px-2 py-1 bg-white border rounded text-gray-600 hover:bg-gray-50 text-xs">Szczegóły</Link>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Service actions modal (centered overlay above table) */}
            {repairsModalOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center">
                    <div className="absolute inset-0" onClick={() => setRepairsModalOpen(false)} />

                    <div className="relative bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 md:mx-0 overflow-y-auto border" style={{ maxHeight: '80vh' }}>
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Lista serwisowa</h3>
                            <button className="text-gray-600" onClick={() => setRepairsModalOpen(false)}>Zamknij</button>
                        </div>
                        <div className="p-4">
                            {repairsLoading && <div>Ładowanie...</div>}
                            {repairsError && <div className="text-red-600">Błąd: {repairsError}</div>}
                            {!repairsLoading && !repairsError && repairsList.length === 0 && (
                                <div className="text-sm text-gray-600">Brak zarejestrowanych czynności serwisowych dla tej awarii.</div>
                            )}
                            {!repairsLoading && repairsList.length > 0 && (
                                <ul className="space-y-3">
                                    {repairsList.map((rp: any) => (
                                        <li key={rp.id} className="p-3 border rounded bg-white">
                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="font-medium text-base">{rp.repair_order_no ?? ('Zlecenie #' + rp.id)}</div>
                                                    <div className="text-sm text-gray-600 mt-1">{translateStatus(rp.status)} — Koszt: {rp.cost ?? '-'}</div>
                                                    <div className="text-xs text-gray-500 mt-1">Utworzono: {(() => {
                                                        const p = formatDateParts(rp.created_at ?? rp.started_at ?? null);
                                                        return `${p.date} ${p.time}`;
                                                    })()}</div>
                                                    {rp.description && (
                                                        <div className="mt-2 text-sm text-gray-700">{rp.description}</div>
                                                    )}

                                                    {rp.actions && Array.isArray(rp.actions) && rp.actions.length > 0 && (
                                                        <div className="mt-3">
                                                            <div className="text-sm font-semibold">Wykonane czynności:</div>
                                                            <ul className="text-sm list-disc list-inside mt-1 text-gray-700">
                                                                {rp.actions.map((a: any, idx: number) => (
                                                                    <li key={idx}>{a.description ?? a.name ?? JSON.stringify(a)}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {paginated && (
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-700">Strona {paginated.current_page} z {paginated.last_page} — {paginated.total} wyników</div>
                    <nav className="inline-flex -space-x-px" aria-label="Pagination">
                        {paginated.prev_page_url ? (
                            <Link href={`${paginated.path}${qsFromState(paginated.current_page - 1)}`} className="px-2 py-1 border bg-white text-xs text-gray-700">Poprzednia</Link>
                        ) : (
                            <span className="px-2 py-1 border bg-gray-100 text-xs text-gray-400">Poprzednia</span>
                        )}

                        {Array.from({ length: paginated.last_page }).map((_, i) => {
                            const page = i + 1;
                            const isCurrent = page === paginated.current_page;
                            return (
                                <Link
                                    key={page}
                                    href={`${paginated.path}${qsFromState(page)}`}
                                    className={`px-2 py-1 border text-xs ${isCurrent ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
                                >
                                    {page}
                                </Link>
                            );
                        })}

                        {paginated.next_page_url ? (
                            <Link href={`${paginated.path}${qsFromState(paginated.current_page + 1)}`} className="px-2 py-1 border bg-white text-xs text-gray-700">Następna</Link>
                        ) : (
                            <span className="px-2 py-1 border bg-gray-100 text-xs text-gray-400">Następna</span>
                        )}
                    </nav>
                </div>
            )}
        </div>
    );
}
