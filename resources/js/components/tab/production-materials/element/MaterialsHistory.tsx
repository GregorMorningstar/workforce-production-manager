import React, { useState, useEffect, useRef } from "react";
import Barcode from "react-barcode";
import axios from "axios";

interface Transaction {
    id: number;
    type: string;
    quantity: number;
    quantity_before: number;
    quantity_after: number;
    reason: string | null;
    user: { id: number; name: string } | null;
    created_at: string;
    production_material: {
        id: number;
        name: string;
        barcode: string;
    };
    barcode?: string | null;
    delivery_number?: string | null;
    delivery_scan?: string | null;
}

interface TransactionData {
    data: Transaction[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
}

export default function MaterialsHistory() {
    const [transactions, setTransactions] = useState<TransactionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const debounceRef = useRef<number | null>(null);

    const fetchTransactions = async (page: number = 1) => {
        setLoading(true);
        try {
            const params: Record<string, any> = { page };
            if (search) params.search = search;
            if (typeFilter) params.type = typeFilter;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;

            const response = await axios.get('/moderator/production-materials/all-history', { params });
            setTransactions(response.data.transactions);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            fetchTransactions(1);
            debounceRef.current = null;
        }, 500);

        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [search, typeFilter, dateFrom, dateTo]);

    const clearFilters = () => {
        setSearch('');
        setTypeFilter('');
        setDateFrom('');
        setDateTo('');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const typeLabels: Record<string, string> = {
        add: 'Dodanie',
        subtract: 'Odjęcie',
    };

    const typeColors: Record<string, string> = {
        add: 'text-green-600',
        subtract: 'text-red-600',
    };

    const items = transactions?.data ?? [];

    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [previewIsPdf, setPreviewIsPdf] = React.useState(false);

    const openPreview = (url?: string | null) => {
        if (!url) return;
        setPreviewUrl(url);
        setPreviewIsPdf(String(url).toLowerCase().endsWith('.pdf'));
        setPreviewOpen(true);
    };
    const closePreview = () => {
        setPreviewOpen(false);
        setPreviewUrl(null);
        setPreviewIsPdf(false);
    };

    return (
        <div>
            <h2 className="font-semibold mb-4 text-lg">Historia materiałów</h2>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-2 items-end">
                <div>
                    <label className="text-xs text-gray-600">Szukaj (nazwa / kod materiału / kod transakcji)</label>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border px-2 py-1 rounded block"
                        placeholder="Szukaj..."
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-600">Typ</label>
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border px-2 py-1 rounded block">
                        <option value="">Wszystkie</option>
                        <option value="add">Dodanie</option>
                        <option value="subtract">Odjęcie</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-600">Data od</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="border px-2 py-1 rounded block"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-600">Data do</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="border px-2 py-1 rounded block"
                    />
                </div>
                <div>
                    <button type="button" onClick={clearFilters} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                        Wyczyść
                    </button>
                </div>
            </div>

            {/* Loading state */}
            {loading ? (
                <div className="text-center py-8 text-gray-500">Ładowanie...</div>
            ) : items.length === 0 ? (
                <div className="text-sm text-gray-500">Brak historii transakcji.</div>
            ) : (
                <>
                    {/* Table */}
                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left">Data</th>
                                    <th className="px-4 py-3 text-left">Materiał</th>
                                    <th className="px-4 py-3 text-left">Barcode</th>
                                    <th className="px-4 py-3 text-left">Numer dostawy</th>
                                    <th className="px-4 py-3 text-left">Scan</th>
                                    <th className="px-4 py-3 text-left">Typ</th>
                                    <th className="px-4 py-3 text-right">Ilość</th>
                                    <th className="px-4 py-3 text-right">Przed</th>
                                    <th className="px-4 py-3 text-right">Po</th>
                                    <th className="px-4 py-3 text-left">Powód</th>
                                    <th className="px-4 py-3 text-left">Użytkownik</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((t) => (
                                    <tr key={t.id} className="border-t hover:bg-gray-50">
                                        <td className="px-4 py-3">{formatDate(t.created_at)}</td>
                                        <td className="px-4 py-3 font-medium">{t.production_material?.name ?? '-'}</td>
                                            <td className="px-4 py-3">
                                                {t.production_material?.barcode ? (
                                                    <div className="inline-block transform scale-75 origin-left max-w-[120px] overflow-hidden">
                                                        <Barcode
                                                            value={String(t.production_material.barcode)}
                                                            format="CODE128"
                                                            width={1}
                                                            height={30}
                                                            fontSize={10}
                                                        />
                                                    </div>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {t.delivery_number ? (
                                                    <div className="text-sm text-gray-700">{t.delivery_number}</div>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {t.delivery_scan ? (
                                                    <button type="button" onClick={() => openPreview(t.delivery_scan)} className="text-blue-600 underline">Podgląd</button>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className={`px-4 py-3 font-medium ${typeColors[t.type] ?? ''}`}>
                                            {typeLabels[t.type] ?? t.type}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">{t.quantity}</td>
                                        <td className="px-4 py-3 text-right font-mono text-gray-500">{t.quantity_before}</td>
                                        <td className="px-4 py-3 text-right font-mono font-medium">{t.quantity_after}</td>
                                        <td className="px-4 py-3 text-gray-600">{t.reason || '-'}</td>
                                        <td className="px-4 py-3">{t.user?.name ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {transactions && transactions.last_page > 1 && (
                        <div className="mt-4 flex items-center justify-center space-x-2">
                            <button
                                onClick={() => fetchTransactions(Math.max(1, currentPage - 1))}
                                className={`px-3 py-1 rounded bg-gray-100 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                                disabled={currentPage === 1}
                            >
                                Poprzednia
                            </button>
                            <span className="px-3 py-1">
                                Strona {transactions.current_page} z {transactions.last_page} (łącznie: {transactions.total})
                            </span>
                            <button
                                onClick={() => fetchTransactions(Math.min(transactions.last_page, currentPage + 1))}
                                className={`px-3 py-1 rounded bg-gray-100 ${currentPage === transactions.last_page ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                                disabled={currentPage === transactions.last_page}
                            >
                                Następna
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Preview modal */}
            {previewOpen && previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
                        <div className="p-4 flex items-center justify-between border-b">
                            <h3 className="text-lg font-medium">Podgląd skanu</h3>
                            <div className="space-x-2">
                                <a href={previewUrl} download className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Pobierz</a>
                                <button onClick={closePreview} className="text-sm px-3 py-1 bg-red-600 text-white rounded">Zamknij</button>
                            </div>
                        </div>
                        <div className="p-4">
                            {previewIsPdf ? (
                                <iframe src={previewUrl} className="w-full h-[70vh]" title="PDF preview" />
                            ) : (
                                <img src={previewUrl} alt="Scan" className="max-w-full h-auto mx-auto" />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
