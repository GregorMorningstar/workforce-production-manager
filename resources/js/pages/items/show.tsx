import React, { useState } from 'react';
import ModeratorLayout from "@/layouts/ModeratorLayout";
import { usePage, Link } from '@inertiajs/react';

export default function ItemShow() {
    const page = usePage();
    const props = page.props as any;
    const item = props.item ?? {};

    const breadcrumbs = [
        { label: 'Home', href: '/moderator' },
        { label: 'Produkty gotowe', href: '/moderator/items' },
        { label: item.name ?? 'Szczegóły', href: '#' },
    ];

    const [showSchema, setShowSchema] = useState(false);

    return (
        <ModeratorLayout title={`Szczegóły: ${item.name ?? ''}`} breadcrumbs={breadcrumbs}>
            <div className="bg-white p-6 rounded shadow">
                <div className="flex gap-6">
                    <div className="w-48 h-48 bg-gray-100 rounded overflow-hidden">
                        {item.image_path ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">Brak zdjęcia</div>
                        )}
                    </div>

                    <div className="flex-1">
                        <h2 className="text-xl font-semibold mb-2">{item.name}</h2>
                        <div className="text-sm text-gray-600 mb-4">{item.description}</div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>Cena:</strong> {item.price != null ? `${item.price} zł` : '-'}</div>
                            <div><strong>Ilość (stock):</strong> {item.stock ?? '-'}</div>
                            <div><strong>Barcode:</strong> {item.barcode ?? '-'}</div>
                            <div><strong>Czas produkcji:</strong> {item.time_of_production != null ? `${Number(item.time_of_production)} s (${(Number(item.time_of_production)/60).toFixed(2)} min)` : '-'}</div>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <Link href={`/moderator/items`} className="px-3 py-1 border rounded">Powrót</Link>
                            <Link href={`/moderator/items/${item.id}/edit`} className="px-3 py-1 bg-green-600 text-white rounded">Edytuj</Link>
                            <Link href={`/moderator/items/production-schema/${item.id}`} className="px-3 py-1 bg-blue-600 text-white rounded">
                                Schemat produkcji
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            {showSchema && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded shadow-lg w-full max-w-3xl p-6 relative">
                        <button
                            onClick={() => setShowSchema(false)}
                            className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
                            aria-label="Zamknij schemat"
                        >
                            ✕
                        </button>

                        <h3 className="text-lg font-semibold mb-4">Schemat produkcji — {item.name}</h3>

                        <div className="overflow-auto">
                            <svg viewBox="0 0 900 160" className="w-full h-40">
                                <defs>
                                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
                                        <path d="M0,0 L10,5 L0,10 z" fill="#333" />
                                    </marker>
                                </defs>

                                <rect x="10" y="30" width="150" height="60" rx="8" fill="#f3f4f6" stroke="#ddd" />
                                <text x="85" y="62" textAnchor="middle" fontSize="14" fill="#111">Przygotowanie</text>

                                <rect x="200" y="30" width="150" height="60" rx="8" fill="#f8fafc" stroke="#ddd" />
                                <text x="275" y="62" textAnchor="middle" fontSize="14" fill="#111">Obróbka</text>

                                <rect x="390" y="30" width="150" height="60" rx="8" fill="#fff7ed" stroke="#ffd699" />
                                <text x="465" y="62" textAnchor="middle" fontSize="14" fill="#111">Montaż</text>

                                <rect x="580" y="30" width="150" height="60" rx="8" fill="#ecfdf5" stroke="#b7f5d6" />
                                <text x="655" y="62" textAnchor="middle" fontSize="14" fill="#111">Kontrola jakości</text>

                                <line x1="160" y1="60" x2="200" y2="60" stroke="#333" strokeWidth="2" markerEnd="url(#arrow)" />
                                <line x1="350" y1="60" x2="390" y2="60" stroke="#333" strokeWidth="2" markerEnd="url(#arrow)" />
                                <line x1="540" y1="60" x2="580" y2="60" stroke="#333" strokeWidth="2" markerEnd="url(#arrow)" />

                                <text x="450" y="110" textAnchor="middle" fontSize="13" fill="#444">Czas produkcji: {item.time_of_production != null ? `${Number(item.time_of_production)} s (${(Number(item.time_of_production)/60).toFixed(2)} min)` : '-'}</text>
                            </svg>
                        </div>
                    </div>
                </div>
            )}
        </ModeratorLayout>
    );
}
