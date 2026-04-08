import React, { useState, useRef, useEffect } from 'react';
import { router, Link } from '@inertiajs/react';
import Barcode from 'react-barcode';
import EditFailuresRepairedCard from '@/components/card/edit-failures-repaired-card';

type Repair = {
    id: number;
    barcode?: string | null;
    status?: string | null;
    cost?: number | null;
    description?: string | null;
    started_at?: string | null;
    finished_at?: string | null;
    repair_order_no?: string | null;
    machineFailure?: { id?: number; machine?: { barcode?: string | null } } | null;
};

type Props = {
    repairs: Repair[];
    pagination?: {
        current_page?: number;
        last_page?: number;
        per_page?: number;
        total?: number;
    } | null;
    filters?: Record<string, any> | null;
    barcode?: string | null;
    machineFailureId?: number | null;
};

function formatDate(d?: string | null) {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleString();
}

const STATUS_MAP: Record<string, string> = {
    reported: 'Zgłoszona',
    diagnosis: 'Diagnoza',
    waiting_for_parts: 'Czeka na części',
    rejected: 'Odrzucona',
    repaired: 'Naprawiony',
    deferred: 'Odroczona',
};

function formatCost(c?: number | null) {
    if (c == null) return '-';
    const n = Number(c);
    if (isNaN(n)) return '-';
    return n.toFixed(2) + ' zł';
}

type DescProps = { text?: string | null };

function DescriptionPreview({ text }: DescProps) {
    const [clicked, setClicked] = useState(false);
    const [hover, setHover] = useState(false);
    const expanded = clicked || hover;
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [maxH, setMaxH] = useState('0px');

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        if (expanded) {
            // expand to full scrollHeight for smooth animation
            setMaxH(el.scrollHeight + 'px');
        } else {
            setMaxH('0px');
        }
    }, [expanded, text]);

    // Defensive: handle empty text
    const fullText = text ?? '';
    if (fullText === '') {
        return <div className="text-sm text-gray-500">-</div>;
    }

    // Show preview only when text is longer than 20 chars
    const PREVIEW_LEN = 20;
    const needsPreview = fullText.length > PREVIEW_LEN;
    const preview = needsPreview ? fullText.slice(0, PREVIEW_LEN) + '...' : fullText;

    // If text is short, just show it plain without interactivity
    if (!needsPreview) {
        return <div className="text-sm whitespace-pre-wrap">{fullText}</div>;
    }

    return (
        <div className="description-preview">
            {!expanded ? (
                <div
                    className="cursor-pointer"
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                    onClick={() => setClicked((c) => !c)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setClicked((c) => !c); }}
                    role="button"
                    tabIndex={0}
                >
                    <div className="truncate max-w-[20rem]">{preview}</div>
                </div>
            ) : null}

            <div
                ref={containerRef}
                style={{ maxHeight: maxH, overflow: 'hidden', transition: 'max-height 240ms ease' }}
                className="mt-2"
                aria-hidden={!expanded}
            >
                <div className="text-sm whitespace-pre-wrap">{fullText}</div>
            </div>
        </div>
    );
}

export default function MachineFailuresRepariedList({ repairs = [], pagination = null, filters = null, barcode = null, machineFailureId = null }: Props) {
    const handleAdd = (machineFailureId?: number) => {
        // przekieruj do tworzenia nowej naprawy
        router.get(`/machines/failures/fix?machine_failure_id=${machineFailureId ?? ''}`);
    };

    // If backend didn't pass the prop for any reason, also check URL query param as a fallback
    const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const machineFailureIdFromQs = qs ? qs.get('machine_failure_id') : null;
    const isReadOnly = !!(machineFailureId ?? (machineFailureIdFromQs ? Number(machineFailureIdFromQs) : null));

    const [q, setQ] = useState(filters?.q ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? '');
    const [debounceTimer, setDebounceTimer] = useState<number | null>(null);
    const isFirstRender = useRef(true);

    const applyFilters = (page = 1) => {
        const params: any = {};
        // include machine_failure_id when present so list stays scoped/read-only
        if (machineFailureId) params.machine_failure_id = machineFailureId;
        // only include barcode when non-empty
        if (barcode) params.barcode = barcode;
        if (q) params.q = q;
        if (statusFilter) params.status = statusFilter;
        if (page) params.page = page;
        router.visit('/machines/failures/fix/list', {
            data: params,
            method: 'get',
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Live filtering with debounce
    useEffect(() => {
        // Skip auto-filter on first render to avoid immediate navigation loop
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (debounceTimer) window.clearTimeout(debounceTimer);
        const id = window.setTimeout(() => applyFilters(1), 350);
        setDebounceTimer(id);
        return () => { if (id) window.clearTimeout(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, statusFilter]);

    const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
    const handleEdit = (id: number) => {
        const found = repairs.find(r => r.id === id) ?? null;
        if (!found) {
            alert('Nie znaleziono rekordu do edycji.');
            return;
        }
        setEditingRepair(found);
    };

    const handleDelete = (id: number) => {
        if (!confirm('Na pewno usunąć tę naprawę?')) return;
        // use DELETE on the correct backend route
        router.delete(`/machines/failures/fix/${id}`, {
            onSuccess: () => applyFilters(),
        });
    };

    return (
        <>
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Link href="/machines/report-failure" className="text-sm text-blue-600 hover:underline">
                        <span className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                        >Powrót do listy awarii
                        </span>
                    </Link>
                    <h2 className="text-lg font-semibold">Lista Napraw</h2>
                </div>
            </div>
                <div className="mb-3 flex gap-2 items-center">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj opis / zlecenie lub barcode" className="border px-2 py-1 rounded w-64" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border px-2 py-1 rounded">
                    <option value="">Wszystkie statusy</option>
                    <option value="reported">Zgłoszona</option>
                    <option value="diagnosis">Diagnoza</option>
                    <option value="waiting_for_parts">Czeka na części</option>
                    <option value="repaired">Naprawiony</option>
                    <option value="rejected">Odrzucona</option>
                </select>
                <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded" onClick={() => { setQ(''); setStatusFilter(''); applyFilters(1); }}>Wyczyść</button>

                {!isReadOnly && (
                    <button
                        className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center shadow"
                        onClick={() => router.get(`/machines/failures/fix?barcode=${encodeURIComponent(barcode ?? '')}`)}
                        title="Dodaj naprawę"
                    >
                        +
                    </button>
                )}
            </div>

            {/* Top pagination */}
            {pagination && (pagination.total ?? 0) > (pagination.per_page ?? 0) && (
                <div className="mb-3 flex items-center justify-center gap-2">
                    <button className="px-2 py-1 border rounded" disabled={(pagination.current_page ?? 1) <= 1} onClick={() => applyFilters((pagination.current_page ?? 1) - 1)}>Poprzednia</button>
                    {Array.from({ length: pagination.last_page ?? 1 }).map((_, idx) => {
                        const p = idx + 1;
                        return (
                            <button key={p} className={`px-2 py-1 border rounded ${p === pagination.current_page ? 'bg-gray-200' : ''}`} onClick={() => applyFilters(p)}>{p}</button>
                        );
                    })}
                    <button className="px-2 py-1 border rounded" disabled={(pagination.current_page ?? 1) >= (pagination.last_page ?? 1)} onClick={() => applyFilters((pagination.current_page ?? 1) + 1)}>Następna</button>
                </div>
            )}
            <div className="overflow-x-auto border rounded">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 text-sm">
                        <tr>
                            <th className="px-4 py-2">Barcode</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Opis</th>
                            <th className="px-4 py-2">Koszt</th>
                            <th className="px-4 py-2">Data serwisu</th>
                            <th className="px-4 py-2">Zlecenie</th>
                            {!isReadOnly && (<th className="px-4 py-2">Akcje</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {repairs.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                                    Brak rekordów.
                                </td>
                            </tr>
                        )}
                        {repairs.map((r) => (
                            <tr key={r.id} className="border-t">
                                <td className="px-4 py-3 align-top">
                                    {((r.machineFailure && r.machineFailure.machine?.barcode) || r.barcode) ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="p-2 bg-white rounded shadow-sm inline-block">
                                                <Barcode
                                                    value={String(r.machineFailure?.machine?.barcode ?? r.barcode ?? '')}
                                                    format="CODE128"
                                                    renderer="svg"
                                                    height={28}
                                                    width={0.7}
                                                    displayValue={false}
                                                />
                                            </div>
                                            <div className="text-xs font-mono text-center text-gray-700">{r.machineFailure?.machine?.barcode ?? r.barcode ?? '-'}</div>
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="px-4 py-3">{r.status ? (STATUS_MAP[r.status] ?? r.status) : '-'}</td>
                                <td className="px-4 py-3 align-top">
                                    {r.description ? (
                                        <>
                                            <DescriptionPreview text={r.description} />

                                        </>
                                    ) : (
                                        <div>
                                            -
                                            <div className="mt-2">
                                                <a
                                                    className="text-xs text-blue-600 hover:underline"
                                                    href={`/machines/failures/fix/list?machine_failure_id=${r.machineFailure?.id ?? r.id}&status=repaired`}
                                                >
                                                    Lista napraw
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3">{formatCost(r.cost)}</td>
                                <td className="px-4 py-3">{formatDate(r.started_at ?? r.finished_at)}</td>
                                <td className="px-4 py-3">{r.repair_order_no ?? ('Zlecenie #' + r.id)}</td>
                                {!isReadOnly && (
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button
                                                className="text-sm text-blue-600 hover:underline"
                                                onClick={() => handleEdit(r.id as number)}
                                            >
                                                Edytuj
                                            </button>
                                            <button
                                                className="text-sm text-red-600 hover:underline"
                                                onClick={() => handleDelete(r.id as number)}
                                            >
                                                Usuń
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {pagination && (pagination.total ?? 0) > (pagination.per_page ?? 0) && (
                <div className="mt-3 flex items-center justify-center gap-2">
                    <button className="px-2 py-1 border rounded" disabled={(pagination.current_page ?? 1) <= 1} onClick={() => applyFilters((pagination.current_page ?? 1) - 1)}>Poprzednia</button>
                    {Array.from({ length: pagination.last_page ?? 1 }).map((_, idx) => {
                        const p = idx + 1;
                        return (
                            <button key={p} className={`px-2 py-1 border rounded ${p === pagination.current_page ? 'bg-gray-200' : ''}`} onClick={() => applyFilters(p)}>{p}</button>
                        );
                    })}
                    <button className="px-2 py-1 border rounded" disabled={(pagination.current_page ?? 1) >= (pagination.last_page ?? 1)} onClick={() => applyFilters((pagination.current_page ?? 1) + 1)}>Następna</button>
                </div>
            )}
        </div>
        {/* Edit modal */}
        {!isReadOnly && editingRepair && (
            <EditFailuresRepairedCard
                repair={editingRepair}
                onClose={() => setEditingRepair(null)}
                onSaved={(updated) => {
                    // after save, refresh list
                    setEditingRepair(null);
                    applyFilters(pagination?.current_page ?? 1);
                }}
            />
        )}
        </>
    );
}
