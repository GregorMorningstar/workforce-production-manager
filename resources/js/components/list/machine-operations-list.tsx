import { Trash, Glasses, Edit } from 'lucide-react';
import React, { useMemo, useState, useEffect } from 'react';
import Barcode from 'react-barcode';

type Props = {
    allOperations?: any[] | null;
    enumStatuses?: string[];
    currentUserRole?: 'user' | 'moderator' | 'admin';
    onView?: (op: any) => void;
    onEdit?: (op: any) => void;
    onDelete?: (op: any) => void;
};

const PAGE_SIZE = 15;

const STATUS_COLOR_MAP: Record<string, string> = {
    working: 'bg-green-100 text-green-800',
    breakdown: 'bg-red-100 text-red-800',
    active: 'bg-blue-100 text-blue-800',
    inactive: 'bg-slate-100 text-slate-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    decommissioned: 'bg-gray-700 text-white',
    forced_downtime: 'bg-yellow-100 text-yellow-800',
};

const STATUS_ROW_BG: Record<string, string> = {
    working: 'bg-green-50',
    breakdown: 'bg-red-50',
    active: 'bg-blue-50',
    inactive: 'bg-slate-50',
    maintenance: 'bg-yellow-50',
    decommissioned: 'bg-gray-100',
    forced_downtime: 'bg-amber-50',
};

const STATUS_LABELS: Record<string, string> = {
    working: 'Pracuje',
    breakdown: 'Awaria',
    active: 'Aktywna',
    inactive: 'Nieaktywna',
    maintenance: 'Serwis / konserwacja',
    decommissioned: 'Wycofana',
    forced_downtime: 'Postój wymuszony',
};

function getStatusClasses(status?: string) {
    if (!status) return 'bg-gray-50 text-gray-700';
    const key = String(status).toLowerCase();
    return STATUS_COLOR_MAP[key] ?? 'bg-gray-50 text-gray-700';
}

function getStatusLabel(status?: string) {
    if (!status) return 'Brak';
    const key = String(status).toLowerCase();
    return STATUS_LABELS[key] ?? String(status);
}

function getRowBgClass(status?: string) {
    if (!status) return '';
    const key = String(status).toLowerCase();
    return STATUS_ROW_BG[key] ? `${STATUS_ROW_BG[key]}` : '';
}

export default function MachineOperationsList({
    allOperations = [],
    enumStatuses = [],
    currentUserRole = 'user',
    onView,
    onEdit,
    onDelete,
}: Props) {
    const [page, setPage] = useState(1);
    const [operationQuery, setOperationQuery] = useState('');
    const [barcodeQuery, setBarcodeQuery] = useState('');
    const [machineQuery, setMachineQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [fetchedStatuses, setFetchedStatuses] = useState<string[]>([]);
    const [previewId, setPreviewId] = useState<number | string | null>(null);
    const [selectedOp, setSelectedOp] = useState<any | null>(null);

    useEffect(() => {
        let mounted = true;
        fetch('/operationmachines/statuses')
            .then((r) => r.ok ? r.json() : Promise.resolve([]))
            .then((data: any) => {
                if (!mounted) return;
                if (Array.isArray(data)) setFetchedStatuses(data.map(String));
            })
            .catch(() => {});
        return () => { mounted = false; };
    }, []);

    // close modal on ESC
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setSelectedOp(null);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const statuses = useMemo(() => {
        const setS = new Set<string>();
        (enumStatuses || []).forEach((s) => s && setS.add(String(s)));
        (fetchedStatuses || []).forEach((s) => s && setS.add(String(s)));
        (allOperations || []).forEach((op: any) => {
            const machineStatus = op.machine?.status ?? op.machine?.status_name ?? '';
            const opStatus = op.status ?? op.status_name ?? (op.status?.name ?? '');
            if (machineStatus) setS.add(String(machineStatus));
            if (opStatus) setS.add(String(opStatus));
        });
        return Array.from(setS).sort();
    }, [enumStatuses, fetchedStatuses, allOperations]);

    useEffect(() => { setPage(1); }, [operationQuery, barcodeQuery, machineQuery, statusFilter]);

    const filtered = useMemo(() => {
        if (!Array.isArray(allOperations)) return [];
        const oq = operationQuery.trim().toLowerCase();
        const bq = barcodeQuery.trim().toLowerCase();
        const mq = machineQuery.trim().toLowerCase();
        const sf = statusFilter.trim().toLowerCase();

        return allOperations.filter((op: any) => {
            const operationName = (op.operation?.name ?? op.operation_name ?? '').toString().toLowerCase();
            const operationBarcode = (op.operation?.barcode ?? op.operation_barcode ?? op.barcode ?? '').toString().toLowerCase();
            const machineName = (op.machine?.name ?? op.machine_name ?? '').toString().toLowerCase();
            const machineStatus = (op.machine?.status ?? op.machine?.status_name ?? (op.machine?.status?.name ?? '')).toString().toLowerCase();
            const status = (op.status ?? op.status_name ?? (op.status?.name ?? '')).toString().toLowerCase();

            if (oq && !operationName.includes(oq)) return false;
            if (bq && !operationBarcode.includes(bq)) return false;
            if (mq && !machineName.includes(mq)) return false;
            if (sf && !(machineStatus.includes(sf) || status.includes(sf))) return false;
            return true;
        });
    }, [allOperations, operationQuery, barcodeQuery, machineQuery, statusFilter]);

    if (!Array.isArray(allOperations) || allOperations.length === 0) {
        return <div>Brak operacji</div>;
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, total);
    const pageItems = filtered.slice(startIndex, endIndex);

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-end md:space-x-4 mb-4">
                <div className="flex flex-col">
                    <label className="text-xs">Nazwa operacji</label>
                    <input
                        value={operationQuery}
                        onChange={(e) => setOperationQuery(e.target.value)}
                        className="border px-2 py-1"
                        placeholder="Szukaj po nazwie operacji"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs">Barcode operacji</label>
                    <input
                        value={barcodeQuery}
                        onChange={(e) => setBarcodeQuery(e.target.value)}
                        className="border px-2 py-1"
                        placeholder="Szukaj po barcode"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs">Nazwa maszyny</label>
                    <input
                        value={machineQuery}
                        onChange={(e) => setMachineQuery(e.target.value)}
                        className="border px-2 py-1"
                        placeholder="Szukaj po nazwie maszyny"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border px-2 py-1"
                    >
                        <option value="">Wszystkie</option>
                        {statuses.map((s) => (
                            <option key={s} value={s}>
                                {getStatusLabel(s)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr>
                            <th className="text-left px-2 py-1">Nazwa operacji</th>
                            <th className="text-left px-2 py-1">Barcode operacji</th>
                            <th className="text-left px-2 py-1">Nazwa maszyny</th>
                            <th className="text-left px-2 py-1">Status maszyny</th>
                            <th className="text-left px-2 py-1">Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageItems.map((op: any) => {
                            const idKey = op.id ?? `${op.operation?.id ?? ''}-${op.machine_id ?? ''}`;
                            const operationName = op.operation?.name ?? op.operation_name ?? '';
                            const operationBarcode = op.operation?.barcode ?? op.operation_barcode ?? op.barcode ?? '';
                            const machineName = op.machine?.name ?? op.machine_name ?? '';
                            const machineStatus = op.machine?.status ?? op.machine?.status_name ?? (op.machine?.status?.name ?? '') ?? '';
                            const duration = op.changeover_time ?? op.operation?.changeover_time ?? null;
                            const machineStatusClasses = getStatusClasses(machineStatus);
                            const rowBg = getRowBgClass(machineStatus);

                            return (
                                <tr key={idKey} className={`border-t relative ${rowBg}`}>
                                    <td className="px-2 py-1">
                                        <span title={duration ? `Czas przezbrojenia: ${duration}` : undefined} className="cursor-help">
                                            {operationName}
                                        </span>
                                    </td>
                                    <td className="px-2 py-1">
                                        <div className="inline-block">
                                            <Barcode
                                                value={String(operationBarcode ?? ' ')}
                                                format="CODE128"
                                                renderer="svg"
                                                height={40}
                                                width={1}
                                                displayValue={false}
                                            />
                                            <div className="text-xs truncate max-w-[120px]">{operationBarcode}</div>
                                        </div>
                                    </td>
                                    <td className="px-2 py-1">{machineName}</td>
                                    <td className="px-2 py-1">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${machineStatusClasses}`}>
                                            {getStatusLabel(machineStatus)}
                                        </span>
                                    </td>
                                    <td className="px-2 py-1 relative overflow-visible">


                                        <button
                                            onClick={() => setSelectedOp(op)}
                                            className="mr-2 text-sm text-blue-600"
                                        >
                                            <Glasses className="w-4 h-4 inline-block" />
                                        </button>

                                        {currentUserRole === 'moderator' || currentUserRole === 'admin' ? (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        const opId = op.id ?? op.operation_id ?? op.operation?.id;
                                                        if (opId) {
                                                            window.location.href = `/moderator/machines/operations/${opId}/edit`;
                                                        }
                                                    }}
                                                    className="mr-2 text-sm text-green-600"
                                                >
                                                    <Edit className="w-4 h-4 inline-block" />
                                                </button>
                                                <button
                                                    onClick={() => (onDelete ? onDelete(op) : console.log('delete', op))}
                                                    className="mr-2 text-sm text-red-600"
                                                >
                                                    <Trash className="w-4 h-4 inline-block" />
                                                </button>
                                            </>
                                        ) : null}



                                        {previewId === idKey && (
                                            <div
                                                className="absolute z-50 right-0 -top-2 w-80 bg-white border rounded shadow-lg p-3 text-sm origin-top-right transform-gpu transition-transform scale-100"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-1">
                                                        <h5 className="font-medium mb-1">Maszyna</h5>
                                                        <div className="text-sm">
                                                            <div className="font-semibold">{machineName || '—'}</div>
                                                            <div className="text-xs text-gray-500">ID: {op.machine?.id ?? op.machine_id ?? '—'}</div>
                                                            {op.machine?.barcode && <div className="mt-1 text-xs">Barcode: <span className="font-mono">{op.machine.barcode}</span></div>}
                                                            <div className="mt-2">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${getStatusClasses(machineStatus)}`}>
                                                                    {getStatusLabel(machineStatus)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="w-[1px] bg-gray-100" />

                                                    <div className="flex-1">
                                                        <h5 className="font-medium mb-1">Operacja</h5>
                                                        <div className="text-sm">
                                                            <div className="font-semibold">{operationName || '—'}</div>
                                                            <div className="text-xs text-gray-500">Przezbrojenie: {duration ?? '—'}</div>
                                                            <div className="mt-2">
                                                                <div className="inline-block p-1 bg-gray-50 rounded">
                                                                    <Barcode
                                                                        value={String(operationBarcode ?? ' ')}
                                                                        format="CODE128"
                                                                        renderer="svg"
                                                                        height={30}
                                                                        width={0.9}
                                                                        displayValue={false}
                                                                    />
                                                                </div>
                                                                <div className="text-xs truncate mt-1">{operationBarcode || '—'}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-3">
                <div className="text-xs">
                    Pokazano {startIndex + 1} - {endIndex} z {total}
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-1 border rounded disabled:opacity-50"
                    >
                        Prev
                    </button>

                    <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                            if (totalPages > 7) {
                                const left = currentPage - 2;
                                const right = currentPage + 2;
                                if (p === 1 || p === totalPages || (p >= left && p <= right)) {
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`px-2 py-1 border rounded ${p === currentPage ? 'bg-gray-200' : ''}`}
                                        >
                                            {p}
                                        </button>
                                    );
                                }
                                if (p === 2 && currentPage > 4) return <span key={p} className="px-2">...</span>;
                                if (p === totalPages - 1 && currentPage < totalPages - 3) return <span key={p} className="px-2">...</span>;
                                return null;
                            }

                            return (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`px-2 py-1 border rounded ${p === currentPage ? 'bg-gray-200' : ''}`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 border rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* centered modal on click */}
            {selectedOp && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    role="dialog"
                    aria-modal="true"
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedOp(null); }}
                >
                    <div className="relative w-full max-w-3xl bg-white rounded shadow-lg p-6 mx-4">
                        <button
                            aria-label="Zamknij"
                            onClick={() => setSelectedOp(null)}
                            className="absolute top-3 right-3 text-gray-600 hover:text-black"
                        >
                            ✕
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold mb-2">Maszyna</h3>
                                <div className="text-sm">
                                    <div className="font-semibold">{selectedOp.machine?.name ?? selectedOp.machine_name ?? '—'}</div>
                                    <div className="text-xs text-gray-500">ID: {selectedOp.machine?.id ?? selectedOp.machine_id ?? '—'}</div>
                                    {selectedOp.machine?.barcode && <div className="mt-1 text-xs">Barcode: <span className="font-mono">{selectedOp.machine.barcode}</span></div>}
                                    <div className="mt-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${getStatusClasses(selectedOp.machine?.status ?? selectedOp.machine?.status_name)}`}>
                                            {getStatusLabel(selectedOp.machine?.status ?? selectedOp.machine?.status_name)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Operacja</h3>
                                <div className="text-sm">
                                    <div className="font-semibold">{selectedOp.operation?.name ?? selectedOp.operation_name ?? '—'}</div>
                                    <div className="text-xs text-gray-500">ID: {selectedOp.operation?.id ?? selectedOp.operation_id ?? '—'}</div>
                                    <div className="mt-3">
                                        <div className="inline-block p-1 bg-gray-50 rounded">
                                                                    <Barcode
                                                                        value={String(selectedOp.operation?.barcode ?? selectedOp.operation_barcode ?? selectedOp.barcode ?? ' ')}
                                                                        format="CODE128"
                                                                        renderer="svg"
                                                                        height={50}
                                                                        width={1}
                                                                        displayValue={false}
                                                                    />
                                        </div>
                                        <div className="text-xs mt-2">Przezbrojenie: {selectedOp.changeover_time ?? '—'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
