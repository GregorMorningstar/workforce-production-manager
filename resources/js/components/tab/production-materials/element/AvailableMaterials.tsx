import React, { useState, useMemo, useRef, useEffect } from "react";
import { usePage, Link, router as Inertia } from "@inertiajs/react";
import Barcode from "react-barcode";

interface Material {
    data: any[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface MaterialGroupOption {
    value: string;
    label: string;
}

export default function AvailableMaterials() {
    const page = usePage();
    const material = (page.props.material as Material | null) ?? null;
    const currentFilters = (page.props.filters as Record<string, any> | null) ?? {};
    const materialGroups = (page.props.materialGroups as MaterialGroupOption[] | null) ?? [];

    const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
    const [name, setName] = useState<string>(urlParams.get('name') ?? currentFilters.name ?? '');
    const [barcode, setBarcode] = useState<string>(urlParams.get('barcode') ?? currentFilters.barcode ?? '');
    const [group, setGroup] = useState<string>(urlParams.get('group') ?? currentFilters.group_material ?? '');
    const [availability, setAvailability] = useState<string>(urlParams.get('availability') ?? currentFilters.availability ?? '');

    // Inline action state (edit in-row)
    const [editingAction, setEditingAction] = useState<{ id: number; type: 'add' | 'subtract' } | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);
    const [quantity, setQuantity] = useState<string>('');
    const [reason, setReason] = useState<string>('');
    const [deliveryNumber, setDeliveryNumber] = useState<string>('');
    const [deliveryScan, setDeliveryScan] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [flash, setFlash] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const items = material?.data ?? [];

    const groupNames: Record<string, string> = useMemo(() => {
        const map: Record<string, string> = {};
        materialGroups.forEach(g => {
            map[g.value] = g.label;
        });
        return map;
    }, [materialGroups]);

    const debounceRef = useRef<number | null>(null);

    function openAddModal(m: any) {
        setSelectedMaterial(m);
        setQuantity('');
        setReason('');
        setDeliveryNumber(m.delivery_number ?? '');
        setDeliveryScan(null);
        setEditingAction({ id: m.id, type: 'add' });
    }

    function openSubtractModal(m: any) {
        setSelectedMaterial(m);
        setQuantity('');
        setReason('');
        setEditingAction({ id: m.id, type: 'subtract' });
    }

    function closeModals() {
        setEditingAction(null);
        setSelectedMaterial(null);
        setQuantity('');
        setReason('');
        setDeliveryNumber('');
        setDeliveryScan(null);
    }

    function handleAddSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedMaterial || isSubmitting) return;

        setIsSubmitting(true);
        const url = `/moderator/production-materials/${selectedMaterial.id}/add`;

        // If file upload is present, use FormData
        const hasFile = deliveryScan !== null;

            if (hasFile) {
            const fd = new FormData();
            fd.append('quantity', String(parseFloat(quantity)));
            if (reason) fd.append('reason', reason);
            if (deliveryNumber) fd.append('delivery_number', deliveryNumber);
            if (deliveryScan) fd.append('delivery_scan', deliveryScan);

            Inertia.post(url, fd, {
                preserveState: true,
                onSuccess: () => {
                    closeModals();
                    setIsSubmitting(false);
                    setFlash({ type: 'success', text: 'Ilość została dodana.' });
                    window.setTimeout(() => setFlash(null), 4000);
                },
                onError: (errors: any) => {
                    setIsSubmitting(false);
                    setFlash({ type: 'error', text: 'Wystąpił błąd podczas dodawania.' });
                    window.setTimeout(() => setFlash(null), 6000);
                },
            });
        } else {
            Inertia.post(url, {
                quantity: parseFloat(quantity),
                reason: reason || undefined,
                delivery_number: deliveryNumber || undefined,
            }, {
                preserveState: true,
                onSuccess: () => {
                    closeModals();
                    setIsSubmitting(false);
                    setFlash({ type: 'success', text: 'Ilość została dodana.' });
                    window.setTimeout(() => setFlash(null), 4000);
                },
                onError: (errors: any) => {
                    setIsSubmitting(false);
                    setFlash({ type: 'error', text: 'Wystąpił błąd podczas dodawania.' });
                    window.setTimeout(() => setFlash(null), 6000);
                },
            });
        }
    }

    function handleSubtractSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedMaterial || isSubmitting) return;

        setIsSubmitting(true);
        Inertia.post(`/moderator/production-materials/${selectedMaterial.id}/subtract`, {
            quantity: parseFloat(quantity),
            reason: reason || undefined,
        }, {
            onSuccess: () => {
                closeModals();
                setIsSubmitting(false);
                setFlash({ type: 'success', text: 'Ilość została odjęta.' });
                window.setTimeout(() => setFlash(null), 4000);
            },
            onError: (errors: any) => {
                setIsSubmitting(false);
                setFlash({ type: 'error', text: 'Wystąpił błąd podczas odejmowania.' });
                window.setTimeout(() => setFlash(null), 6000);
            }
        });
    }

    function doFilter() {
        Inertia.get(window.location.pathname, {
            name: name || undefined,
            barcode: barcode || undefined,
            group: group || undefined,
            availability: availability || undefined,
        }, { preserveState: true, replace: true, preserveScroll: true });
    }

    function submitFilters(e?: React.FormEvent) {
        e?.preventDefault();
        // immediate apply on submit
        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        doFilter();
    }

    function clearFilters() {
        setName('');
        setBarcode('');
        setGroup('');
        setAvailability('');
        Inertia.get(window.location.pathname, {}, { preserveState: true, replace: true, preserveScroll: true });
    }

    // apply filters as user types (debounced)
    useEffect(() => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            doFilter();
            debounceRef.current = null;
        }, 500);

        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name, barcode, group, availability]);

    function buildPageHref(pageNum: number) {
        const q = new URLSearchParams(window.location.search);
        q.set('page', String(pageNum));
        return `${window.location.pathname}?${q.toString()}`;
    }

    const pagesToShow = useMemo(() => {
        if (!material) return [] as number[];
        const total = material.last_page;
        const current = material.current_page;
        const delta = 2;
        const start = Math.max(1, current - delta);
        const end = Math.min(total, current + delta);
        const arr: number[] = [];
        for (let i = start; i <= end; i++) arr.push(i);
        return arr;
    }, [material]);

    return (
        <div>
            {flash && (
                <div className={`mb-3 p-3 rounded ${flash.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {flash.text}
                </div>
            )}
            <h2 className="font-semibold mb-2">Materiały dostępne</h2>

            <form onSubmit={submitFilters} className="flex flex-wrap gap-2 items-end mb-3">
                <div>
                    <label className="text-xs text-gray-600">Nazwa</label>
                    <input value={name} onChange={e => setName(e.target.value)} className="border px-2 py-1 rounded block" />
                </div>
                <div>
                    <label className="text-xs text-gray-600">Kod</label>
                    <input value={barcode} onChange={e => setBarcode(e.target.value)} className="border px-2 py-1 rounded block" />
                </div>
                <div>
                    <label className="text-xs text-gray-600">Grupa</label>
                    <select value={group} onChange={e => setGroup(e.target.value)} className="border px-2 py-1 rounded block">
                        <option value="">Wszystkie</option>
                        {materialGroups.map(g => (
                            <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-600">Dostępność</label>
                    <select value={availability} onChange={e => setAvailability(e.target.value)} className="border px-2 py-1 rounded block">
                        <option value="">Wszystkie</option>
                        <option value="in_stock">Dostępne</option>
                        <option value="out_of_stock">Brak</option>
                    </select>
                </div>
                <div>
                    <button type="submit" className="bg-gray-200 text-gray-800 px-3 py-1 rounded mr-2">Zastosuj</button>
                    <button type="button" onClick={clearFilters} className="bg-red-600 text-white px-3 py-1 rounded">Wyczyść</button>
                </div>
            </form>

            {items.length === 0 ? (
                <div className="text-sm text-gray-500">Brak materiałów.</div>
            ) : (
                <div className="relative">
                    <div className="overflow-x-auto bg-white rounded-lg">
                        <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left">
                                <th className="px-2 py-1">ID</th>
                                <th className="px-2 py-1">Nazwa</th>
                                <th className="px-2 py-1">Kod</th>
                                <th className="px-2 py-1">Grupa</th>
                                <th className="px-2 py-1">Dostępne</th>
                                <th className="px-2 py-1">Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((m: any) => (
                                <React.Fragment key={m.id}>
                                    <tr className="border-t">
                                        <td className="px-2 py-2">{m.id}</td>
                                        <td className="px-2 py-2">{m.name}</td>
                                        <td className="px-2 py-2">
                                            {m.barcode ? (
                                                <div title={m.barcode} className="inline-block transform scale-75 sm:scale-100 origin-center max-w-[100px] sm:max-w-[150px] overflow-hidden">
                                                    <Barcode value={String(m.barcode)} format="CODE128" width={1} height={40} displayValue={false} />
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-500">-</div>
                                            )}
                                            {m.barcode && (
                                                <div className="text-[10px] sm:text-xs font-mono text-gray-600 mt-1 max-w-[100px] sm:max-w-[140px] truncate" title={m.barcode}>{m.barcode}</div>
                                            )}
                                        </td>
                                        <td className="px-2 py-2">{groupNames[m.group_material] ?? m.group_material ?? '-'}</td>
                                        <td className="px-2 py-2">{m.available_quantity ?? '-'}</td>
                                        <td className="px-2 py-2">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => openAddModal(m)}
                                                    className="text-xs sm:text-sm bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                                                    title="Dodaj ilość"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => openSubtractModal(m)}
                                                    className="text-xs sm:text-sm bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                                                    title="Odejmij ilość"
                                                >
                                                    -
                                                </button>
                                                <Link href={`/moderator/production-materials/${m.id}/history`} className="text-xs sm:text-sm bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">Historia</Link>
                                            </div>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td colSpan={6} className="px-2 py-4 bg-gray-50">
                                            <div className={`overflow-hidden transform origin-top transition-all duration-200 ${editingAction?.id === m.id ? 'scale-y-100 opacity-100 max-h-[800px]' : 'scale-y-0 opacity-0 max-h-0'}`}>
                                                <form onSubmit={editingAction?.type === 'add' ? handleAddSubmit : handleSubtractSubmit} className="flex flex-col sm:flex-row gap-4 items-start p-2">
                                                    <div className="flex-1">
                                                        <div className="font-medium mb-2">{editingAction?.type === 'add' ? 'Dodaj ilość' : 'Odejmij ilość'} - {(selectedMaterial ?? m).name}</div>
                                                        {editingAction?.type === 'subtract' && <div className="text-sm text-gray-600 mb-2">Dostępna ilość: {(selectedMaterial ?? m).available_quantity ?? 0}</div>}

                                                        <div className="mb-2">
                                                            <label className="block text-sm font-medium mb-1">Ilość</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0.01"
                                                                max={editingAction?.type === 'subtract' ? (selectedMaterial ?? m).available_quantity ?? 0 : undefined}
                                                                value={quantity}
                                                                onChange={(e) => setQuantity(e.target.value)}
                                                                className="w-full border px-3 py-2 rounded"
                                                                required
                                                            />
                                                        </div>

                                                        <div className="mb-2">
                                                            <label className="block text-sm font-medium mb-1">Powód (opcjonalnie)</label>
                                                            <input
                                                                type="text"
                                                                value={reason}
                                                                onChange={(e) => setReason(e.target.value)}
                                                                className="w-full border px-3 py-2 rounded"
                                                                maxLength={255}
                                                            />
                                                        </div>

                                                            {editingAction?.type === 'add' && (
                                                                <>
                                                                    <div className="mb-2">
                                                                        <label className="block text-sm font-medium mb-1">Numer dostawy <span className="text-red-600">*</span></label>
                                                                        <input
                                                                            type="text"
                                                                            value={deliveryNumber}
                                                                            onChange={(e) => setDeliveryNumber(e.target.value)}
                                                                            className="w-full border px-3 py-2 rounded"
                                                                            maxLength={255}
                                                                            required
                                                                        />
                                                                    </div>

                                                                    <div className="mb-2">
                                                                        <label className="block text-sm font-medium mb-1">Skany dostawy (JPEG/PNG/PDF)</label>
                                                                        <input
                                                                            type="file"
                                                                            accept="image/jpeg,image/png,application/pdf"
                                                                            onChange={(e) => setDeliveryScan(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                                                                            className="w-full"
                                                                        />
                                                                    </div>
                                                                </>
                                                            )}
                                                    </div>

                                                    <div className="flex-shrink-0 flex items-center space-x-2">
                                                        <button
                                                            type="button"
                                                            onClick={closeModals}
                                                            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                                            disabled={isSubmitting}
                                                        >
                                                            Anuluj
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className={`px-4 py-2 text-white rounded ${editingAction?.type === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}
                                                            disabled={isSubmitting}
                                                        >
                                                            {isSubmitting ? (editingAction?.type === 'add' ? 'Dodawanie...' : 'Odejmowanie...') : (editingAction?.type === 'add' ? 'Dodaj' : 'Odejmij')}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                        </table>
                    </div>


                </div>
            )}

            {material && (
                <div className="mt-3 flex items-center space-x-2">
                    <Link
                        href={buildPageHref(Math.max(1, material.current_page - 1))}
                        className={`px-3 py-1 rounded bg-gray-100 ${!material.prev_page_url ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        Poprzednia
                    </Link>

                    <div className="flex items-center space-x-1">
                        {pagesToShow[0] > 1 && (
                            <Link href={buildPageHref(1)} className="px-3 py-1 rounded bg-gray-100">1</Link>
                        )}
                        {pagesToShow[0] > 2 && <div className="px-2">...</div>}

                        {pagesToShow.map(p => (
                            <Link key={p} href={buildPageHref(p)} className={`px-3 py-1 rounded ${p === material.current_page ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
                                {p}
                            </Link>
                        ))}

                        {pagesToShow[pagesToShow.length - 1] < material.last_page - 1 && <div className="px-2">...</div>}
                        {pagesToShow[pagesToShow.length - 1] < material.last_page && (
                            <Link href={buildPageHref(material.last_page)} className="px-3 py-1 rounded bg-gray-100">{material.last_page}</Link>
                        )}
                    </div>

                    <Link
                        href={buildPageHref(Math.min(material.last_page, material.current_page + 1))}
                        className={`px-3 py-1 rounded bg-gray-100 ${!material.next_page_url ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        Następna
                    </Link>
                </div>
            )}


        </div>
    );
}
