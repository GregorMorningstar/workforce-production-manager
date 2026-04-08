import { PlusCircleIcon, List as ListIcon, ArrowRightIcon, X as XIcon } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import Barcode from 'react-barcode';

const PAGE_SIZE = 10;

interface MachineFailure {
    id: number;
    machine?: { id: number; name: string; barcode?: string; status?: string; last_failure_date?: string };
    barcode?: string;
    failure_description: string;
    reported_at: string;
    failure_rank?: number;
    user_id?: number;
    user?: { name?: string };
}

interface Props {
    allmachineFailures: MachineFailure[];
    auth: { user?: { id?: number; role?: string; name?: string } };
}

const truncateWords = (text: string | undefined, words = 50): string => {
    if (!text) return '';
    const parts = text.split(/\s+/);
    if (parts.length <= words) return text;
    return parts.slice(0, words).join(' ') + '...';
};

const mapStatus = (status: string | undefined): string => {
    if (!status) return '-';
    const map: Record<string, string> = {
        breakdown: 'Awaria',
        operational: 'Sprawna',
        maintenance: 'W serwisie',
        idle: 'Nieaktywna'
    };
    return map[status.toLowerCase()] ?? status.charAt(0).toUpperCase() + status.slice(1);
};

export default function MachineFailuresList({ allmachineFailures = [], auth = {} }: Props) {
    const user = auth?.user ?? {};
    const userRole = String(user?.role ?? '').toLowerCase();

    const [hovered, setHovered] = useState<number | null>(null);
    const [selected, setSelected] = useState<MachineFailure | null>(null);
    const [localFailures, setLocalFailures] = useState<MachineFailure[]>(allmachineFailures);
    const [repairsModalOpen, setRepairsModalOpen] = useState(false);
    const [repairsLoading, setRepairsLoading] = useState(false);
    const [repairsError, setRepairsError] = useState<string | null>(null);
    const [repairsList, setRepairsList] = useState<any[]>([]);

    useEffect(() => {
        setLocalFailures(allmachineFailures);
    }, [allmachineFailures]);

    // sorting state (null = no sort)
    const [sortBy, setSortBy] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const toggleSort = (key: string) => {
        if (sortBy === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(key);
            setSortDir('desc');
        }
    };

    const openRepairsPreview = useCallback(async (machineFailureId: number) => {
        setRepairsModalOpen(true);
        setRepairsLoading(true);
        setRepairsError(null);
        setRepairsList([]);
        try {
            const res = await fetch(`/machines/failures/${machineFailureId}/repairs`, { headers: { 'Accept': 'application/json' } });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setRepairsList(Array.isArray(json) ? json : json.data ?? []);
        } catch (e: any) {
            setRepairsError(e.message || 'Błąd pobierania');
        } finally {
            setRepairsLoading(false);
        }
    }, []);

    // filters & pagination
    const [filterName, setFilterName] = useState('');
    const [filterBarcode, setFilterBarcode] = useState('');
    const [dateFrom, setDateFrom] = useState<string | null>(null);
    const [dateTo, setDateTo] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Filtered list (client-side, live)
    const filtered = useMemo(() => {
        return localFailures.filter((item) => {
            // machine name
            if (filterName && !item.machine?.name?.toLowerCase().includes(filterName.toLowerCase())) {
                return false;
            }

            // barcode
            if (filterBarcode && !item.barcode?.toLowerCase().includes(filterBarcode.toLowerCase())) {
                return false;
            }

            // date from
            if (dateFrom && item.reported_at) {
                const itemDate = new Date(item.reported_at);
                const from = new Date(dateFrom);
                from.setHours(0, 0, 0, 0);
                if (itemDate < from) return false;
            }

            // date to
            if (dateTo && item.reported_at) {
                const itemDate = new Date(item.reported_at);
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
                if (itemDate > to) return false;
            }

            return true;
        });
    }, [localFailures, filterName, filterBarcode, dateFrom, dateTo]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [filtered]);

    // Apply sorting on filtered results
    const sorted = useMemo(() => {
        const arr = [...filtered];
        if (!sortBy) return arr;
        arr.sort((a: any, b: any) => {
            const av = (sortBy === 'failure_rank' ? (a.failure_rank ?? 0) : (a[sortBy] ?? '')) as any;
            const bv = (sortBy === 'failure_rank' ? (b.failure_rank ?? 0) : (b[sortBy] ?? '')) as any;
            if (av === bv) return 0;
            if (sortDir === 'asc') return av > bv ? 1 : -1;
            return av < bv ? 1 : -1;
        });
        return arr;
    }, [filtered, sortBy, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const displayed = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Row background based on age of failure (days)
    const getRowBackground = useCallback((item: MachineFailure) => {
        if (!item.reported_at) return undefined;
        const reported = new Date(item.reported_at);
        if (isNaN(reported.getTime())) return undefined;
        const now = new Date();
        const days = (now.getTime() - reported.getTime()) / (1000 * 60 * 60 * 24);
        if (days > 3) return '#f6d7db'; // pastel burgundy
        if (days > 2) return '#ffd6d6'; // pastel red
        if (days > 1) return '#fff4b0'; // pastel yellow
        return undefined;
    }, []);

    function handleOpenRepairNextStep(machineFailureId: number): void {
        const failure = localFailures.find(f => f.id === machineFailureId);
        console.log('Znaleziona awaria:', failure);
        console.log('Machine data:', failure?.machine);
        console.log('Machine barcode:', failure?.machine?.barcode);

        if (!failure?.machine?.barcode) {
            console.error('Nie znaleziono barcode maszyny dla awarii:', machineFailureId);
            alert('Błąd: Brak kodu kreskowego maszyny. Sprawdź dane w konsoli.');
            return;
        }

        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const repairOrderNo = `RO-${failure.machine.barcode}/${day}-${month}-${year}`;

        console.log('Wygenerowany numer zlecenia:', repairOrderNo);
        router.get(`/machines/failures/fix?repair_order_no=${repairOrderNo}&machine_failure_id=${machineFailureId}`);
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex gap-2">
                        <button className="px-3 py-1 text-sm border rounded">All</button>
                        {userRole === 'moderator' && (
                            <button className="px-3 py-1 text-sm border rounded">Moderator Action</button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 ml-auto">
                        <input
                            placeholder="Nazwa maszyny"
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            className="px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            placeholder="Barcode"
                            value={filterBarcode}
                            onChange={(e) => setFilterBarcode(e.target.value)}
                            className="px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <label className="flex items-center gap-1 text-xs text-gray-600">
                            Od
                            <input
                                type="date"
                                value={dateFrom ?? ''}
                                onChange={(e) => setDateFrom(e.target.value || null)}
                                className="px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </label>
                        <label className="flex items-center gap-1 text-xs text-gray-600">
                            Do
                            <input
                                type="date"
                                value={dateTo ?? ''}
                                onChange={(e) => setDateTo(e.target.value || null)}
                                className="px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </label>
                        <button
                            onClick={() => {
                                setFilterName('');
                                setFilterBarcode('');
                                setDateFrom(null);
                                setDateTo(null);
                            }}
                            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
                        >
                            Wyczyść
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <colgroup>
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '40%' }} />
                        <col style={{ width: '6%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '9%' }} />
                    </colgroup>
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="p-3 text-left font-medium text-gray-900">Nazwa</th>
                            <th className="p-3 text-left font-medium text-gray-900">Opis</th>
                            <th
                                className="p-3 text-left font-medium text-gray-900 cursor-pointer select-none"
                                onClick={() => toggleSort('failure_rank')}
                                title="Sortuj po rankingu"
                            >
                                Ranking {sortBy === 'failure_rank' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th className="p-3 text-left font-medium text-gray-900">Barcode</th>
                            <th className="p-3 text-left font-medium text-gray-900">Data awarii</th>
                            <th className="p-3 text-left font-medium text-gray-900">Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayed.map((item) => (
                            <tr
                                key={item.id}
                                className="border-t border-gray-200 hover:bg-gray-50"
                                style={{ backgroundColor: getRowBackground(item) }}
                            >
                                <td className="p-3 font-medium">{item.machine?.name ?? '-'}</td>

                                <td className="p-3 relative max-w-xs">
                                    <div className="truncate" title={item.failure_description}>
                                        {truncateWords(item.failure_description, 15)}
                                    </div>
                                    {hovered === item.id && (
                                        <div className="absolute left-0 top-full z-20 mt-1 p-3 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm whitespace-normal max-h-48 overflow-y-auto">
                                            {item.failure_description}
                                        </div>
                                    )}
                                </td>

                                <td className="p-3 text-sm font-medium text-gray-900">{item.failure_rank ?? '-'}</td>

                                <td className="p-3">
                                    {item.barcode ? (
                                            <div className="w-32 h-8 flex items-center justify-center">
                                                <Barcode
                                                    value={String(item.barcode ?? '')}
                                                    format="CODE128"
                                                    renderer="svg"
                                                    height={32}
                                                    width={1.5}
                                                    displayValue={false}
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm">-</span>
                                        )}
                                </td>

                                <td className="p-3 text-sm text-gray-900">{item.reported_at ?? '-'}</td>

                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        {/* Przyciski: kolejna naprawa oraz podgląd napraw */}
                                        <button
                                            onClick={() => handleOpenRepairNextStep(item.id)}
                                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Dodaj kolejną naprawę"
                                            aria-label="Dodaj kolejną naprawę"
                                        >
                                            <PlusCircleIcon className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => router.get('/machines/failures/fix/list', { barcode: item.barcode })}
                                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Lista napraw"
                                            aria-label="Lista napraw"
                                        >
                                            <ListIcon className="w-4 h-4" />
                                        </button>

                                                {/* only add-repair icons allowed per request - no edit/delete/preview */}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                    <div className="text-sm text-gray-700">
                        Pokazano {displayed.length} z {filtered.length} ({totalPages} stron)
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            &laquo; Poprzednia
                        </button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-2 text-sm font-medium border rounded-md transition-colors ${
                                        pageNum === currentPage
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Następna &raquo;
                        </button>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selected && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-start justify-between gap-6">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        {selected.machine?.name ?? 'Nazwa maszyny'}
                                    </h2>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <div><strong>Stan:</strong> {mapStatus(selected.machine?.status)}</div>
                                        <div><strong>Ostatnia awaria:</strong> {selected.machine?.last_failure_date ?? '-'}</div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 text-right min-w-[140px]">
                                    {selected.machine?.barcode ? (
                                        <div className="mb-2">
                                            <Barcode
                                                value={String(selected.machine.barcode ?? '')}
                                                format="CODE128"
                                                renderer="svg"
                                                height={60}
                                                width={1}
                                                displayValue={false}
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 text-sm">Brak kodu</div>
                                    )}
                                    {selected.machine?.id && (
                                        <div className="text-xs text-gray-500">ID: {selected.machine.id}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900">Szczegóły awarii</h3>

                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <strong className="block mb-2 text-sm font-medium text-gray-900">Opis:</strong>
                                <p className="whitespace-pre-wrap text-gray-900 leading-relaxed">
                                    {selected.failure_description}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div>
                                    <strong className="text-sm font-medium text-gray-900">Ranking:</strong>
                                    <div className="mt-1 text-sm text-gray-900">{selected.failure_rank ?? '-'}</div>
                                </div>
                                <div>
                                    <strong className="text-sm font-medium text-gray-900">Zgłoszona:</strong>
                                    <div className="mt-1 text-sm text-gray-900">{selected.reported_at ?? '-'}</div>
                                </div>
                                <div>
                                    <strong className="text-sm font-medium text-gray-900">Użytkownik:</strong>
                                    <div className="mt-1 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        {selected.user?.name ?? `User #${selected.user_id ?? '-'}`}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <button
                                onClick={() => setSelected(null)}
                                className="px-6 py-2 text-sm font-medium text-blue-600 bg-transparent border border-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                                Zamknij
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Repairs Preview Modal */}
            {repairsModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setRepairsModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Podgląd napraw</h3>
                            <button
                                className="text-gray-500 p-2 rounded hover:bg-gray-100"
                                onClick={() => setRepairsModalOpen(false)}
                                title="Zamknij"
                                aria-label="Zamknij"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4">
                            {repairsLoading && <div>Ładowanie...</div>}
                            {repairsError && <div className="text-red-600">Błąd: {repairsError}</div>}
                            {!repairsLoading && !repairsError && repairsList.length === 0 && (
                                <div className="text-sm text-gray-600">Brak zarejestrowanych napraw dla tej awarii.</div>
                            )}
                            {!repairsLoading && repairsList.length > 0 && (
                                <ul className="space-y-3">
                                    {repairsList.map((r) => (
                                        <li key={r.id} className="p-3 border rounded flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">{r.repair_order_no ?? ('Zlecenie #' + r.id)}</div>
                                                <div className="text-sm text-gray-600">{r.status ?? '-'} — Koszt: {r.cost ?? '-'}</div>
                                                <div className="text-xs text-gray-400">Utworzono: {r.created_at ?? '-'}</div>
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => router.get(`/machines/failures/fix/${r.machine_failure_id}`)}
                                                    className="p-2 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                                    title="Otwórz"
                                                    aria-label="Otwórz"
                                                >
                                                    <ArrowRightIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
