import ModeratorLayout from "@/layouts/ModeratorLayout";
import { useForm, Link, usePage } from "@inertiajs/react";
import React, { useState, useEffect } from 'react';

export default function ProductionCreate() {
    const breadcrumbs = [
        { label: "Home", href: "/moderator" },
        { label: "Produkty gotowe", href: "/moderator/items" },
        { label: "Dodaj produkt gotowy", href: "/moderator/items/create" },
    ];


    const page = usePage();
    const props = page.props as any;
    const editingItem = props.item ?? null;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: "",
        description: "",
        price: "",
        stock: 0,
        time_of_production: 60,
        image: null,
    });

    const [preview, setPreview] = useState<string | null>(null);

    function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setData('image', file as any);
        if (file) setPreview(URL.createObjectURL(file));
        else setPreview(null);
    }

    useEffect(() => {
        if (editingItem) {
            setData('name', editingItem.name ?? '');
            setData('description', editingItem.description ?? '');
            setData('price', editingItem.price ?? '');
            setData('stock', editingItem.stock ?? 0);
            setData('time_of_production', editingItem.time_of_production ?? 60);
            // do not set image file; preview can use existing image_path
            if (editingItem.image_path) setPreview(editingItem.image_path);
        }

        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editingItem) {
            put(`/moderator/items/${editingItem.id}`, {
                onSuccess: () => { window.location.href = '/moderator/items'; },
            });
            return;
        }

        post('/moderator/items', {
            onSuccess: () => {
                reset();
                // redirect back to list
                window.location.href = '/moderator/items';
            },
        });
    }

    return (
        <ModeratorLayout title="Dodaj produkt gotowy" breadcrumbs={breadcrumbs}>
            <div className="bg-white p-6">
                <h3 className="text-lg font-semibold mb-4">Nowy produkt gotowy</h3>

                <form onSubmit={submit} encType="multipart/form-data" className="space-y-6">
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Nazwa</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                        {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Opis</label>
                        <textarea rows={4} value={data.description} onChange={(e) => setData('description', e.target.value)} className="w-full border border-gray-200 rounded-md px-3 py-2 h-28 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        {errors.description && <div className="text-red-600 text-sm mt-1">{errors.description}</div>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Cena (zł)</label>
                            <input type="number" step="0.01" value={data.price as any} onChange={(e) => setData('price', e.target.value)} className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                            {errors.price && <div className="text-red-600 text-sm mt-1">{errors.price}</div>}
                        </div>

                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Ilość w magazynie</label>
                            <input type="number" value={data.stock as any} onChange={(e) => setData('stock', Number(e.target.value))} className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                            {errors.stock && <div className="text-red-600 text-sm mt-1">{errors.stock}</div>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Czas produkcji (sekundy)</label>
                        <input type="number" value={data.time_of_production as any} onChange={(e) => setData('time_of_production', Number(e.target.value))} className="w-32 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                        {errors.time_of_production && <div className="text-red-600 text-sm mt-1">{errors.time_of_production}</div>}
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Zdjęcie</label>
                        <div className="flex items-center gap-4">
                            <div>
                                <input type="file" accept="image/*" onChange={handleImage} />
                                {errors.image && <div className="text-red-600 text-sm mt-1">{errors.image}</div>}
                            </div>

                            <div className="w-28 h-28 bg-gray-50 rounded border flex items-center justify-center overflow-hidden">
                                {preview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={preview} alt="preview" className="object-cover w-full h-full" />
                                ) : (
                                    <div className="text-xs text-gray-400">Brak podglądu</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-sm text-gray-500">Kod kreskowy zostanie wygenerowany automatycznie po zapisaniu (prefiks 8000).</div>

                    <div className="flex items-center gap-3 justify-end">
                        <Link href="/moderator/items" className="px-4 py-2 border rounded-md text-sm text-gray-700">Anuluj</Link>
                        <button type="submit" disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">{processing ? 'Wysyłanie...' : (editingItem ? 'Zapisz' : 'Utwórz')}</button>
                    </div>
                </form>
            </div>
        </ModeratorLayout>
    );
}
