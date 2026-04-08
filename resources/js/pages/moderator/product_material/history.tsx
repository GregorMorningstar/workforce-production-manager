import React, { useState, useEffect, useRef } from "react";
import { usePage, Link, router as Inertia } from "@inertiajs/react";
import ModeratorLayout from "../../../layouts/ModeratorLayout";
import Barcode from "react-barcode";

interface Transaction {
    id: number;
    type: string;
    quantity: number;
    quantity_before: number;
    quantity_after: number;
    reason: string | null;
    user: { id: number; name: string } | null;
    created_at: string;
    delivery_scan?: string | null;
    delivery_number?: string | null;
}

interface TransactionData {
    data: Transaction[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Material {
    id: number;
    name: string;
    barcode: string;
    available_quantity: number;
}

export default function History() {
    const page = usePage();
    const material = (page.props.material as Material);
    const transactions = (page.props.transactions as TransactionData);
    const currentFilters = (page.props.filters as Record<string, any> | null) ?? {};

    const [typeFilter, setTypeFilter] = useState<string>(currentFilters.type ?? '');
    const [dateFrom, setDateFrom] = useState<string>(currentFilters.date_from ?? '');
    const [dateTo, setDateTo] = useState<string>(currentFilters.date_to ?? '');
    const debounceRef = useRef<number | null>(null);

    const items = transactions?.data ?? [];

    function doFilter() {
        Inertia.get(window.location.pathname, {
            type: typeFilter || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, { preserveState: true, replace: true, preserveScroll: true });
    }

    function clearFilters() {
        setTypeFilter('');
        setDateFrom('');
        setDateTo('');
        Inertia.get(window.location.pathname, {}, { preserveState: true, replace: true, preserveScroll: true });
    }

    useEffect(() => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            doFilter();
            debounceRef.current = null;
        }, 500);

        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [typeFilter, dateFrom, dateTo]);

    function buildPageHref(pageNum: number) {
        const q = new URLSearchParams(window.location.search);
        q.set('page', String(pageNum));
        return `${window.location.pathname}?${q.toString()}`;
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    const publicScanUrl = (path?: string | null) => {
        if (!path) return '';
        const p = String(path);
        if (p.startsWith('http') || p.startsWith('//')) return p;
        if (p.startsWith('/')) return p;
        if (p.startsWith('storage/')) return '/' + p;
        if (p.startsWith('delivery_scans/')) return '/storage/' + p;
        return '/storage/' + p;
    }

    const typeLabels: Record<string, string> = {
        add: 'Dodanie',
        subtract: 'Odjęcie',
    };

    const typeColors: Record<string, string> = {
        add: 'text-green-600',
        subtract: 'text-red-600',
    };

    return (
        <ModeratorLayout>
            <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Historia transakcji</h1>
                        <p className="text-gray-600">Materiał: {material.name}</p>
                        {material.barcode && (
                            <div className="mt-2 inline-block">
                                <Barcode value={String(material.barcode)} format="CODE128" width={1} height={40} fontSize={12} />
                            </div>
                        )}
                        <p className="text-sm text-gray-500 mt-2">Aktualna ilość: {material.available_quantity}</p>
                    </div>
                    <Link
                        href="/moderator/production-materials"
                        className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200"
                    >
                        Powrót do listy
                    </Link>
                </div>

                <div className="mb-4 flex flex-wrap gap-2 items-end">
                    <div>
                        <label className="text-xs text-gray-600">Typ</label>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border px-2 py-1 rounded block">
                            <option value="">Wszystkie</option>
                            <option value="add">Dodanie</option>
                            <option value="subtract">Odjęcie</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-600">Data od</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border px-2 py-1 rounded block" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-600">Data do</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border px-2 py-1 rounded block" />
                    </div>
                    <div>
                        <button type="button" onClick={clearFilters} className="bg-red-600 text-white px-3 py-1 rounded">Wyczyść</button>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="text-sm text-gray-500">Brak historii transakcji.</div>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left">Data</th>
                                    <th className="px-4 py-3 text-left">Typ</th>
                                    <th className="px-4 py-3 text-right">Ilość</th>
                                    <th className="px-4 py-3 text-right">Przed</th>
                                    <th className="px-4 py-3 text-right">Po</th>
                                    <th className="px-4 py-3 text-left">Scan</th>
                                    <th className="px-4 py-3 text-left">Powód</th>
                                    <th className="px-4 py-3 text-left">Użytkownik</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((t) => (
                                    <tr key={t.id} className="border-t hover:bg-gray-50">
                                        <td className="px-4 py-3">{formatDate(t.created_at)}</td>
                                        <td className={`px-4 py-3 font-medium ${typeColors[t.type] ?? ''}`}>
                                            {typeLabels[t.type] ?? t.type}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">{t.quantity}</td>
                                        <td className="px-4 py-3 text-right font-mono text-gray-500">{t.quantity_before}</td>
                                        <td className="px-4 py-3 text-right font-mono font-medium">{t.quantity_after}</td>
                                        <td className="px-4 py-3">
                                            {t.delivery_scan ? (
                                                <div className="flex items-center">
                                                    {String(t.delivery_scan).toLowerCase().endsWith('.pdf') ? (
                                                        <a href={publicScanUrl(t.delivery_scan)} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">PDF</a>
                                                    ) : (
                                                        <a href={publicScanUrl(t.delivery_scan)} target="_blank" rel="noopener noreferrer">
                                                            <img src={publicScanUrl(t.delivery_scan)} alt="Scan" className="w-16 h-auto border rounded" />
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{t.reason || '-'}</td>
                                        <td className="px-4 py-3">{t.user?.name ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {transactions && transactions.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-center space-x-2">
                        <Link
                            href={buildPageHref(Math.max(1, transactions.current_page - 1))}
                            className={`px-3 py-1 rounded bg-gray-100 ${!transactions.prev_page_url ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-200'}`}
                        >
                            Poprzednia
                        </Link>
                        <span className="px-3 py-1">
                            Strona {transactions.current_page} z {transactions.last_page}
                        </span>
                        <Link
                            href={buildPageHref(Math.min(transactions.last_page, transactions.current_page + 1))}
                            className={`px-3 py-1 rounded bg-gray-100 ${!transactions.next_page_url ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-200'}`}
                        >
                            Następna
                        </Link>
                    </div>
                )}
            </div>
        </ModeratorLayout>
    );
}
