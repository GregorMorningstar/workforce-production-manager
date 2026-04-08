import React, { useState, useEffect, useMemo } from 'react';
import { usePage, Link } from '@inertiajs/react';
import Barcode from 'react-barcode';
import axios from 'axios';
import { Edit, Trash2, Check, X, FileText } from 'lucide-react';

type Item = {
    id: number;
    name: string;
    barcode?: string | number | null;
    stock?: number | null;
    price?: number | null;
    time_of_production?: number | null;
};

type ProductPageProps = {
    onAddClick?: () => void;
};

export default function ProductPage({ onAddClick }: ProductPageProps) {
    const page = usePage();
    const props = (page.props as any) || {};
    const items: Item[] = props.itemsFinishedGoods ?? props.items ?? [];

    const [editing, setEditing] = useState<Item | null>(null);
    const [saving, setSaving] = useState(false);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortAsc, setSortAsc] = useState<boolean>(true);

    // search state
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [minPrice, setMinPrice] = useState<number | ''>('');
    const [maxPrice, setMaxPrice] = useState<number | ''>('');

    // (removed slider state) price inputs will be used instead

    // derive price bounds from items
    const [dataMin, dataMax] = useMemo(() => {
        if (!items || items.length === 0) return [0, 1000];
        const costs = items.map((i) => Number(i.price ?? 0));
        const min = Math.floor(Math.min(...costs));
        const max = Math.ceil(Math.max(...costs));
        return [min, Math.max(min + 1, max)];
    }, [items]);

    useEffect(() => {
        // initialize min/max price when items change
        setMinPrice((p) => (p === '' ? dataMin : p));
        setMaxPrice((p) => (p === '' ? dataMax : p));
    }, [dataMin, dataMax]);

    // debounce query like Allegro-style live search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
        return () => clearTimeout(t);
    }, [query]);

    const filteredItems = useMemo(() => {
        if (!items || items.length === 0) return [];

        const filtered = items.filter((it) => {
            const q = debouncedQuery.toLowerCase();
            const matchesQuery =
                q === '' ||
                String(it.name ?? '').toLowerCase().includes(q) ||
                String(it.barcode ?? '').toLowerCase().includes(q) ||
                String(it.price ?? '').toLowerCase().includes(q);

            const price = Number(it.price ?? 0);
            const matchesMin = minPrice === '' ? true : price >= Number(minPrice);
            const matchesMax = maxPrice === '' ? true : price <= Number(maxPrice);

            return matchesQuery && matchesMin && matchesMax;
        });

        // sorting
        if (sortKey) {
            const numericKeys = ['price', 'stock', 'time_of_production', 'id'];
            filtered.sort((a: any, b: any) => {
                const ak = a[sortKey];
                const bk = b[sortKey];
                if (numericKeys.includes(sortKey)) {
                    const na = Number(ak ?? 0);
                    const nb = Number(bk ?? 0);
                    return sortAsc ? na - nb : nb - na;
                }
                const sa = String(ak ?? '').toLowerCase();
                const sb = String(bk ?? '').toLowerCase();
                if (sa < sb) return sortAsc ? -1 : 1;
                if (sa > sb) return sortAsc ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [items, debouncedQuery, minPrice, maxPrice, sortKey, sortAsc]);

    async function handleDelete(id: number) {
        if (!confirm("Na pewno usunąć ten produkt?")) return;
        try {
            await axios.delete(`/moderator/items/${id}`);
            // reload page props
            window.location.reload();
        } catch (e) {
            // fallback: show error
            // eslint-disable-next-line no-console
            console.error(e);
            alert("Błąd usuwania. Upewnij się, że endpoint istnieje.");
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!editing) return;
        setSaving(true);
        try {
            await axios.put(`/moderator/items/${editing.id}`, {
                name: editing.name,
                barcode: editing.barcode,
                stock: editing.stock,
                price: editing.price,
                time_of_production: editing.time_of_production,
            });
            window.location.reload();
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(err);
            alert("Błąd zapisu. Upewnij się, że endpoint istnieje.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="bg-white rounded shadow p-4">
            <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col">
                    <div className="mt-3 flex items-center gap-4">
                        <div className="w-72">
                            <label className="text-xs text-gray-600 mb-1 block">Filtr ceny</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min={dataMin}
                                    max={dataMax}
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder={String(dataMin)}
                                    className="w-1/2 border rounded px-2 py-1 text-sm"
                                />
                                <input
                                    type="number"
                                    min={dataMin}
                                    max={dataMax}
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder={String(dataMax)}
                                    className="w-1/2 border rounded px-2 py-1 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-white border rounded px-2 py-1">
                                <input
                                    type="search"
                                    placeholder="Szukaj (nazwa, barcode, cena)"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="outline-none text-sm"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => onAddClick?.()}
                                className="inline-flex items-center justify-center w-9 h-9 bg-blue-600 text-white rounded-full shadow-sm hover:bg-blue-700"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* right header area intentionally left empty (search+add moved left) */}
            </div>

            {filteredItems.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                    <button type="button" onClick={() => { if (sortKey === 'id') { setSortAsc(!sortAsc); } else { setSortKey('id'); setSortAsc(true); } }} className="flex items-center gap-2">
                                        ID {sortKey === 'id' ? (sortAsc ? '▲' : '▼') : ''}
                                    </button>
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                    <button type="button" onClick={() => { if (sortKey === 'name') { setSortAsc(!sortAsc); } else { setSortKey('name'); setSortAsc(true); } }} className="flex items-center gap-2">
                                        Nazwa {sortKey === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                                    </button>
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                    <button type="button" onClick={() => { if (sortKey === 'barcode') { setSortAsc(!sortAsc); } else { setSortKey('barcode'); setSortAsc(true); } }} className="flex items-center gap-2">
                                        Kod / Barcode {sortKey === 'barcode' ? (sortAsc ? '▲' : '▼') : ''}
                                    </button>
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                    <button type="button" onClick={() => { if (sortKey === 'stock') { setSortAsc(!sortAsc); } else { setSortKey('stock'); setSortAsc(true); } }} className="flex items-center gap-2">
                                        Ilość {sortKey === 'stock' ? (sortAsc ? '▲' : '▼') : ''}
                                    </button>
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                    <button type="button" onClick={() => { if (sortKey === 'price') { setSortAsc(!sortAsc); } else { setSortKey('price'); setSortAsc(true); } }} className="flex items-center gap-2">
                                        Cena {sortKey === 'price' ? (sortAsc ? '▲' : '▼') : ''}
                                    </button>
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                    <button type="button" onClick={() => { if (sortKey === 'time_of_production') { setSortAsc(!sortAsc); } else { setSortKey('time_of_production'); setSortAsc(true); } }} className="flex items-center gap-2">
                                        Czas produkcji (s) {sortKey === 'time_of_production' ? (sortAsc ? '▲' : '▼') : ''}
                                    </button>
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Akcje</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredItems.map((it) => (
                                <tr key={it.id}>
                                    <td className="px-4 py-3 text-sm text-gray-700">{it.id}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{it.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {it.barcode ? (
                                            <div className="inline-block">
                                                <Barcode value={String(it.barcode)} format="CODE128" width={1} height={40} fontSize={12} />
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">Brak</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{it.stock ?? '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{it.price != null ? `${it.price} zł` : '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{it.time_of_production != null ? `${Number(it.time_of_production)} s (${(Number(it.time_of_production)/60).toFixed(2)} min)` : '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => setEditing(it)} className="px-2 py-1 bg-green-500 text-white rounded text-sm flex items-center justify-center" title="Edytuj">
                                                <Edit className="w-4 h-4" />
                                            </button>

                                            <button type="button" onClick={() => handleDelete(it.id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm flex items-center justify-center" title="Usuń">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <Link href={`/moderator/items/${it.id}`} className="px-2 py-1 bg-blue-500 text-white rounded text-sm flex items-center justify-center" title="Szczegóły">
                                                <FileText className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {editing && (
                <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6">
                    <div className="bg-white rounded shadow max-w-xl w-full p-4">
                        <h3 className="font-semibold mb-2">Edytuj produkt #{editing.id}</h3>
                        <form onSubmit={handleSave} className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-600">Nazwa</label>
                                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full border px-2 py-1 rounded" />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-600">Barcode</label>
                                <input value={String(editing.barcode ?? '')} onChange={(e) => setEditing({ ...editing, barcode: e.target.value })} className="w-full border px-2 py-1 rounded" />
                            </div>


                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-600">Ilość (stock)</label>
                                    <input type="number" value={editing.stock ?? 0} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} className="w-full border px-2 py-1 rounded" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600">Cena (price)</label>
                                    <input type="number" step="0.01" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className="w-full border px-2 py-1 rounded" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-600">Czas produkcji (sekundy)</label>
                                <input type="number" value={editing.time_of_production ?? 0} onChange={(e) => setEditing({ ...editing, time_of_production: Number(e.target.value) })} className="w-full border px-2 py-1 rounded" />
                                <div className="text-xs text-gray-500 mt-1">Wartość zapisywana w sekundach; w tabeli wyświetlane też w minutach.</div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setEditing(null)} className="px-3 py-1 border rounded">Anuluj</button>
                                <button type="submit" disabled={saving} className="px-3 py-1 bg-blue-600 text-white rounded">{saving ? 'Zapisywanie...' : 'Zapisz'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </div>
    );
}
