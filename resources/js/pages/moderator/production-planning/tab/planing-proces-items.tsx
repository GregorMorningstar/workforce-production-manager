import React from 'react';
import { usePage, Link } from "@inertiajs/react";

interface Schema {
    id: number;
    name: string;
    items_finished_good_id: number;
    item?: {
        id: number;
        name: string;
    };
    steps?: any[];
}

interface PaginatedSchemas {
    data: Schema[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page: number;
    last_page: number;
}

export default function ProductionPlanning() {
    const { props } = usePage();
    const schemas = props.schemas as PaginatedSchemas;

    return (
        <div>
            <h2 className="text-lg font-semibold mb-4">Schematy produkcji</h2>
            {(!schemas?.data || schemas.data.length === 0) ? (
                <div className="text-sm text-gray-500">Brak dostępnych schematów produkcji.</div>
            ) : (
                <>
                    <div className="space-y-3">
                        {schemas.data.map((s: Schema) => (
                            <div key={s.id} className="border rounded p-4 bg-white shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="text-md font-medium">{s.name}</div>
                                        <div className="text-sm text-gray-600 mt-1">Produkt: {s.item?.name ?? '—'}</div>
                                        <div className="text-sm text-gray-500">Kroki: {s.steps?.length ?? 0}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/moderator/items/production-schema/${s.items_finished_good_id}`}
                                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                        >
                                            Pokaż
                                        </Link>
                                        <Link
                                            href={`/moderator/items/production-schema/${s.items_finished_good_id}/create-step`}
                                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                                        >
                                            Dodaj krok
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {schemas.links && schemas.links.length > 3 && (
                        <div className="flex justify-center items-center gap-1 mt-6">
                            {schemas.links.map((link, idx) => {
                                if (!link.url) {
                                    return (
                                        <span
                                            key={idx}
                                            className="px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                }
                                return (
                                    <Link
                                        key={idx}
                                        href={link.url}
                                        className={`px-3 py-2 text-sm rounded transition ${
                                            link.active
                                                ? 'bg-indigo-600 text-white font-semibold'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
