import ModeratorLayout from '@/layouts/ModeratorLayout';
import { usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function SchemasIndex() {
    const { schemas, filters: initialFilters } = usePage().props as any;
    const items = schemas?.data ?? [];

    const [filters, setFilters] = useState({ q: initialFilters?.q ?? '' });

    useEffect(() => {
        const t = setTimeout(() => {
            router.get(window.location.pathname, filters, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(t);
    }, [filters]);

    return (
        <ModeratorLayout breadcrumbs={[{ label: 'Home', href: '/moderator' }, { label: 'Schematy produkcji', href: '/moderator/production-schemas' }]} title="Schematy produkcji">
            <div className="p-4">
                <div className="mb-4 flex gap-2">
                    <input value={filters.q} onChange={e => setFilters({ q: e.target.value })} placeholder="Filtruj po nazwie lub produkcie" className="border px-2 py-1 w-64" />
                </div>

                <div className="bg-white rounded shadow">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="text-left">
                                <th className="px-4 py-2">ID</th>
                                <th className="px-4 py-2">Nazwa schematu</th>
                                <th className="px-4 py-2">Produkt</th>
                                <th className="px-4 py-2">Kroki</th>
                                <th className="px-4 py-2">Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((s: any) => (
                                <tr key={s.id} className="border-t">
                                    <td className="px-4 py-3">{s.id}</td>
                                    <td className="px-4 py-3">{s.name}</td>
                                    <td className="px-4 py-3">{s.item?.name ?? '-'}</td>
                                    <td className="px-4 py-3">{s.steps_count ?? (s.steps ? s.steps.length : 0)}</td>
                                    <td className="px-4 py-3">
                                        <a href={`/moderator/items/production-schema/${s.item_id ?? s.items_finished_good_id ?? ''}`} className="text-blue-600">Pokaż</a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {schemas?.links && (
                    <nav className="mt-4">
                        <ul className="inline-flex gap-2">
                            {schemas.links.map((link: any, idx: number) => (
                                <li key={idx}>
                                    <a
                                        href={link.url ?? '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1 border rounded ${link.active ? 'bg-gray-200' : 'bg-white'}`}
                                    />
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}
            </div>
        </ModeratorLayout>
    );
}
