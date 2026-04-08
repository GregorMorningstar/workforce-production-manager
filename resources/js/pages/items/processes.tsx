import React from 'react';
import ModeratorLayout from "@/layouts/ModeratorLayout";
import { usePage, Link } from '@inertiajs/react';
import Barcode from 'react-barcode';

export default function ItemsWithProcesses() {
    const page = usePage();
    const props = (page.props as any) || {};
    const paginator = props.itemsFinishedGoods ?? { data: [], links: [] };
    const filters = props.filters ?? {};

    const breadcrumbs = [
        { label: 'Home', href: '/moderator' },
        { label: 'Produkty gotowe', href: '/moderator/items' },
        { label: 'Produkty z procesem', href: '#' },
    ];

    return (
        <ModeratorLayout title="Produkty z procesem" breadcrumbs={breadcrumbs}>
            <div className="bg-white p-4 rounded shadow">
                <div className="mb-4 flex gap-4 items-end">
                    <form method="get" className="flex gap-2 items-end">
                        <div>
                            <label className="text-xs text-gray-600">Nazwa</label>
                            <input name="name" defaultValue={filters.name ?? ''} className="border rounded px-2 py-1" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600">Barcode</label>
                            <input name="barcode" defaultValue={filters.barcode ?? ''} className="border rounded px-2 py-1" />
                        </div>
                        <div>
                            <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Filtruj</button>
                        </div>
                    </form>
                </div>

                {(!paginator?.data || paginator.data.length === 0) ? (
                    <div className="text-sm text-gray-500">Brak produktów z przypisanym procesem produkcji.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nazwa</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Barcode</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Kroki</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Czas produkcji</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cena</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Akcje</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginator.data.map((it: any) => (
                                    <tr key={it.id}>
                                        <td className="px-4 py-2">
                                            <Link href={`/moderator/items/${it.id}`} className="text-blue-600 hover:underline">{it.name}</Link>
                                        </td>
                                        <td className="px-4 py-2">
                                            {it.barcode ? (
                                                <Barcode value={String(it.barcode)} height={40} format="CODE128" />
                                            ) : (
                                                <span className="text-sm text-gray-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">{it.steps_count ?? 0}</td>
                                        <td className="px-4 py-2">{it.time_of_production != null ? `${Number(it.time_of_production)} s` : '-'}</td>
                                        <td className="px-4 py-2">{it.price != null ? `${it.price} zł` : '-'}</td>
                                        <td className="px-4 py-2 flex gap-2">
                                            <Link href={`/moderator/items/production-schema/${it.id}/create-step`} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Dodaj proces</Link>
                                            <Link href={`/moderator/items/${it.id}/edit`} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Edytuj</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* pagination */}
                        {paginator.links && paginator.links.length > 0 && (
                            <div className="flex justify-center items-center gap-1 mt-6">
                                {paginator.links.map((link: any, idx: number) => {
                                    if (!link.url) {
                                        return (
                                            <span key={idx} className="px-3 py-2 text-sm text-gray-400 cursor-not-allowed" dangerouslySetInnerHTML={{ __html: link.label }} />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            className={`px-3 py-2 text-sm rounded transition ${link.active ? 'bg-indigo-600 text-white font-semibold' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ModeratorLayout>
    );
}
