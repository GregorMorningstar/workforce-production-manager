import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { router, usePage } from "@inertiajs/react";

type Leave = {
    id: number;
    user_id: number;
    user?: { id: number; name: string } | null;
    start_date: string;
    end_date: string;
    status: string;
    reason?: string | null;
    description?: string | null;
    days: number;
    type?: string | null;
};

export default function PendingLeavesTable({ pendingLeaves = [] }: { pendingLeaves: Leave[] }) {
    const { flash } = usePage().props as any;

    const [items, setItems] = useState<Leave[]>(pendingLeaves);
    const [successMsg, setSuccessMsg] = useState<string | null>(flash?.success ?? null);
    const [errorMsg, setErrorMsg] = useState<string | null>(flash?.error ?? null);

    // sync flash from server on page load / visits (AFTER state declarations)
    useEffect(() => {
        setSuccessMsg(flash?.success ?? null);
        setErrorMsg(flash?.error ?? null);
    }, [flash?.success, flash?.error]);

    // clear success when an error appears
    useEffect(() => {
        if (errorMsg) setSuccessMsg(null);
    }, [errorMsg]);

    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalType, setModalType] = useState<'approve' | 'reject'>('approve');
    const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
    const [description, setDescription] = useState<string>('');

    useEffect(() => setItems(pendingLeaves), [pendingLeaves]);

    // clear flash messages after a timeout
    useEffect(() => {
        if (successMsg) {
            const t = setTimeout(() => setSuccessMsg(null), 5000);
            return () => clearTimeout(t);
        }
    }, [successMsg]);

    useEffect(() => {
        if (errorMsg) {
            const t = setTimeout(() => setErrorMsg(null), 7000);
            return () => clearTimeout(t);
        }
    }, [errorMsg]);

    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / perPage));
    useEffect(() => { if (page > pages) setPage(pages); }, [pages, page]);

    const paginated = useMemo(() => {
        const start = (page - 1) * perPage;
        return items.slice(start, start + perPage);
    }, [items, page, perPage]);

    const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString() : "-";

    const stats = {
        totalPending: total,
        uniqueUsers: new Set(items.map(i => i.user_id)).size,
        shown: paginated.length,
    };

    const openModal = (leave: Leave, type: 'approve' | 'reject') => {
        setSelectedLeave(leave);
        setModalType(type);
        setDescription('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedLeave(null);
        setDescription('');
    };

    const handleSubmit = () => {
        if (!selectedLeave) return;

        const endpoint = modalType === 'approve'
            ? `/moderator/leaves/approve`
            : `/moderator/leaves/reject`;

        const meta = {
            id: selectedLeave.id,
            days: selectedLeave.days,
            type: (selectedLeave as any).type ?? null,
            user_id: selectedLeave.user_id,
            year: new Date(selectedLeave.start_date).getFullYear(),
        };

        const data = modalType === 'approve'
            ? { description, ...meta }
            : { rejection_reason: description, ...meta };

        // clear any previous flashes immediately to avoid showing stale success
        setSuccessMsg(null);
        setErrorMsg(null);

        router.post(endpoint, data, {
            onSuccess: (page) => {
                const serverFlash = (page?.props as any)?.flash ?? {};
                if (serverFlash.error) {
                    // Backend returned an error but likely updated the leave status (e.g. rejected due to insufficient balance).
                    // Remove the item from pending list and close modal, but show the error message.
                    setItems(prev => prev.filter(l => l.id !== selectedLeave!.id));
                    try { closeModal(); } catch (e) {}
                    setErrorMsg(serverFlash.error);
                    setSuccessMsg(null);
                    return;
                }
                // success path
                setItems(prev => prev.filter(l => l.id !== selectedLeave!.id));
                try { closeModal(); } catch (e) {}
                setSuccessMsg(serverFlash.success ?? (modalType === 'approve' ? 'Urlop zatwierdzony.' : 'Urlop odrzucony.'));
                setErrorMsg(null);
            },
            onError: (errors) => {
                // Inertia will call onError for 422 — extract message or fallback
                const errMsg = (errors && typeof errors === 'object')
                    ? (errors.error ?? Object.values(errors)[0] ?? 'Błąd serwera')
                    : 'Błąd serwera';
                setErrorMsg(errMsg as string);
                setSuccessMsg(null);
            }
        });
    };

    return (
        <div>
            {/* flash messages */}
            {successMsg && (
                <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
                    {successMsg}
                    <button onClick={() => setSuccessMsg(null)} className="ml-4 font-bold">×</button>
                </div>
            )}
            {errorMsg && (
                <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
                    {errorMsg}
                    <button onClick={() => setErrorMsg(null)} className="ml-4 font-bold">×</button>
                </div>
            )}

            <div className="mb-4 grid grid-cols-3 gap-4">
                <div className="p-3 bg-white rounded shadow">
                    <div className="text-sm text-gray-500">Łącznie oczekujących</div>
                    <div className="text-2xl font-semibold">{stats.totalPending}</div>
                </div>
                <div className="p-3 bg-white rounded shadow">
                    <div className="text-sm text-gray-500">Unikalni użytkownicy</div>
                    <div className="text-2xl font-semibold">{stats.uniqueUsers}</div>
                </div>
                <div className="p-3 bg-white rounded shadow">
                    <div className="text-sm text-gray-500">Pokazane</div>
                    <div className="text-2xl font-semibold">{stats.shown}</div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-left">
                            <th className="px-4 py-2 border">ID</th>
                            <th className="px-4 py-2 border">Użytkownik</th>
                            <th className="px-4 py-2 border">Ilość dni</th>
                            <th className="px-4 py-2 border">Data rozpoczęcia</th>
                            <th className="px-4 py-2 border">Data zakończenia</th>
                            <th className="px-4 py-2 border">Status</th>
                            <th className="px-4 py-2 border">Powód (użytkownik)</th>
                            <th className="px-4 py-2 border">Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.length === 0 ? (
                            <tr>
                                <td className="px-4 py-3 border text-center" colSpan={8}>Brak oczekujących urlopów</td>
                            </tr>
                        ) : (
                            paginated.map((leave) => (
                                <tr key={leave.id} className="odd:bg-white even:bg-gray-50">
                                    <td className="px-4 py-2 border">{leave.id}</td>
                                    <td className="px-4 py-2 border">{leave.user?.name ?? `#${leave.user_id}`}</td>
                                    <td className="px-4 py-2 border">{leave.days}</td>
                                    <td className="px-4 py-2 border">{formatDate(leave.start_date)}</td>
                                    <td className="px-4 py-2 border">{formatDate(leave.end_date)}</td>
                                    <td className="px-4 py-2 border">{leave.status}</td>
                                    <td className="px-4 py-2 border">{leave.reason ?? leave.description ?? "-"}</td>
                                    <td className="px-4 py-2 border">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openModal(leave, 'approve')}
                                                className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                                            >
                                                Zatwierdź
                                            </button>
                                            <button
                                                onClick={() => openModal(leave, 'reject')}
                                                className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                            >
                                                Odrzuć
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span>Strona</span>
                    <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="border rounded p-1">
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Poprzednia</button>
                    <span>{page} / {pages}</span>
                    <button disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Następna</button>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-transparent backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 shadow-2xl pointer-events-auto">
                        <h3 className="text-lg font-semibold mb-4">
                            {modalType === 'approve' ? 'Zatwierdź urlop' : 'Odrzuć urlop'}
                        </h3>

                        {selectedLeave && (
                            <div className="mb-4 p-3 bg-gray-50 rounded">
                                <div><strong>Użytkownik:</strong> {selectedLeave.user?.name ?? `#${selectedLeave.user_id}`}</div>
                                <div><strong>Ilość dni:</strong> {selectedLeave.days}</div>
                                <div><strong>Okres:</strong> {formatDate(selectedLeave.start_date)} - {formatDate(selectedLeave.end_date)}</div>
                                <div><strong>Opis użytkownika:</strong> {selectedLeave.reason ?? selectedLeave.description ?? "-"}</div>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {modalType === 'approve' ? 'Opis zatwierdzenia *' : 'Powód odrzucenia *'}
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={modalType === 'approve' ? 'Podaj opis zatwierdzenia...' : 'Podaj powód odrzucenia...'}
                                className="w-full p-2 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                required
                            />
                            {description.trim() === '' && (
                                <p className="text-red-500 text-sm mt-1">To pole jest wymagane</p>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!description.trim()}
                                className={`px-4 py-2 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                                    modalType === 'approve'
                                        ? 'bg-green-500 hover:bg-green-600'
                                        : 'bg-red-500 hover:bg-red-600'
                                }`}
                            >
                                {modalType === 'approve' ? 'Zatwierdź' : 'Odrzuć'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
