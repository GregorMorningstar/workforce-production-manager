import ModeratorLayout from '@/layouts/ModeratorLayout';
import { usePage, useForm, router } from '@inertiajs/react';
import { FormEvent, useState, useEffect } from 'react';

interface Machine {
    id: number;
    name: string;
    serial_number: string;
    model?: string;
    status?: string;
}

interface Operation {
    id: number;
    operation_name: string;
    machine_id: number;
}

interface Material {
    id: number;
    name: string;
    group_material?: string;
    material_form?: string;
}

interface Item {
    id: number;
    name: string;
}

interface Step {
    id: number;
    step_number: number;
    machine_id: number;
    operationmachine_id: number;
    production_material_id?: number;
    required_quantity?: number;
    unit?: string;
    output_product_name?: string;
    output_quantity?: number;
    production_time_seconds?: number;
    notes?: string;
    production_schema_id: number;
}

export default function EditStep() {
    const page = usePage();
    const props = page.props as any;
    const step = props.step as Step;
    const item = props.item as Item;
    const machines = props.machines as Machine[];
    const operations = props.operations as Operation[];
    const materials = props.materials as Material[];
    const materialForms = props.materialForms as { value: string; label: string }[];
    const [materialsList, setMaterialsList] = useState<Material[]>(materials || []);
    const [operationsList, setOperationsList] = useState<Operation[]>(operations || []);
    const [showNewMaterial, setShowNewMaterial] = useState(false);
    const [newMaterialName, setNewMaterialName] = useState('');
    const [newMaterialForm, setNewMaterialForm] = useState(materialForms.length ? materialForms[0].value : '');
    const [showNewOperation, setShowNewOperation] = useState(false);
    const [newOperationName, setNewOperationName] = useState('');
    const [newOperationTime, setNewOperationTime] = useState('');
    const [showNewOutputProduct, setShowNewOutputProduct] = useState(false);
    const [newOutputProductName, setNewOutputProductName] = useState('');
    const [newOutputProductForm, setNewOutputProductForm] = useState(materialForms.length ? materialForms[0].value : '');

    const [selectedMachineId, setSelectedMachineId] = useState<number | null>(step.machine_id || null);

    const { data, setData, put, processing, errors } = useForm({
        step_number: step.step_number,
        machine_id: step.machine_id.toString(),
        operationmachine_id: step.operationmachine_id.toString(),
        production_material_id: step.production_material_id?.toString() || '',
        required_quantity: step.required_quantity?.toString() || '',
        unit: step.unit || '',
        production_time_seconds: step.production_time_seconds?.toString() || '',
        output_product_name: step.output_product_name || '',
        output_quantity: step.output_quantity?.toString() || '',
        notes: step.notes || '',
    });

    const breadcrumbs = [
        { label: 'Home', href: '/moderator' },
        { label: 'Produkty gotowe', href: '/moderator/items' },
        { label: item?.name || 'Produkt', href: `/moderator/items/${item?.id}` },
        { label: 'Edytuj krok', href: '#' },
    ];

    // Filtruj operacje po wybranej maszynie
    const filteredOperations = selectedMachineId
        ? operationsList.filter(op => op.machine_id === selectedMachineId)
        : [];

    const handleMachineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const machineId = parseInt(e.target.value);
        setSelectedMachineId(machineId);
        setData('machine_id', e.target.value);
        setData('operationmachine_id', ''); // Reset operacji
    };

    const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const materialId = e.target.value;
        setData('production_material_id', materialId);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/moderator/items/production-schema/step/${step.id}`);
    };

    return (
        <ModeratorLayout breadcrumbs={breadcrumbs} title="Edytuj krok schematu produkcji">
            <div className="p-6">
                <div className="bg-white rounded shadow p-6">
                    <h2 className="text-2xl font-semibold mb-6">
                        Edycja kroku schematu produkcji: {item?.name}
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Krok nr: <strong>{step.step_number}</strong>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Numer kroku (można edytować) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Numer kroku
                            </label>
                            <input
                                type="number"
                                value={data.step_number}
                                onChange={(e) => setData('step_number', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Wybór maszyny */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Maszyna <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.machine_id}
                                onChange={handleMachineChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">-- Wybierz maszynę --</option>
                                {machines.map(machine => (
                                    <option key={machine.id} value={machine.id}>
                                        {machine.name} {machine.serial_number ? `(SN: ${machine.serial_number})` : machine.model ? `(${machine.model})` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.machine_id && (
                                <p className="text-red-500 text-sm mt-1">{errors.machine_id}</p>
                            )}
                        </div>

                        {/* Wybór operacji (pokazuje się po wybraniu maszyny) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Operacja <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={data.operationmachine_id}
                                    onChange={(e) => setData('operationmachine_id', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    disabled={!selectedMachineId}
                                    required
                                >
                                    <option value="">
                                        {selectedMachineId ? '-- Wybierz operację --' : '-- Najpierw wybierz maszynę --'}
                                    </option>
                                    {filteredOperations.map(operation => (
                                        <option key={operation.id} value={operation.id}>
                                            {operation.operation_name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowNewOperation(v => !v)}
                                    disabled={!selectedMachineId}
                                    className="px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Inna operacja
                                </button>
                            </div>
                            {errors.operationmachine_id && (
                                <p className="text-red-500 text-sm mt-1">{errors.operationmachine_id}</p>
                            )}
                        </div>

                        {showNewOperation && selectedMachineId && (
                            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nazwa operacji</label>
                                        <input value={newOperationName} onChange={(e) => setNewOperationName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Czas (minuty)</label>
                                        <input type="number" value={newOperationTime} onChange={(e) => setNewOperationTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!newOperationName) return alert('Podaj nazwę operacji');
                                            const tokenMeta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
                                            const token = tokenMeta?.getAttribute('content') || '';
                                            try {
                                                const res = await fetch('/moderator/machines/operations/quick-store', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'X-CSRF-TOKEN': token,
                                                        'Accept': 'application/json',
                                                    },
                                                    credentials: 'same-origin',
                                                    body: JSON.stringify({ operation_name: newOperationName, machine_id: selectedMachineId, changeover_time: newOperationTime || null }),
                                                });
                                                const json = await res.json();
                                                if (json.success && json.operation) {
                                                    setOperationsList(prev => [...prev, json.operation]);
                                                    setData('operationmachine_id', String(json.operation.id));
                                                    setShowNewOperation(false);
                                                    setNewOperationName('');
                                                    setNewOperationTime('');
                                                } else {
                                                    alert(json.message || 'Błąd dodawania operacji');
                                                }
                                            } catch (e) {
                                                alert('Błąd sieci podczas tworzenia operacji');
                                            }
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Dodaj operację
                                    </button>
                                    <button type="button" onClick={() => setShowNewOperation(false)} className="px-4 py-2 border rounded">Anuluj</button>
                                </div>
                            </div>
                        )}

                        {/* Wybór materiału (opcjonalnie) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Materiał (pobierany)
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={data.production_material_id}
                                    onChange={handleMaterialChange}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">-- Brak / Wybierz materiał --</option>
                                    {materialsList.map(material => (
                                        <option key={material.id} value={material.id}>
                                            {material.name} {material.material_form ? `(${material.material_form})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowNewMaterial(v => !v)}
                                    className="px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50"
                                >
                                    Inny materiał
                                </button>
                            </div>
                            {errors.production_material_id && (
                                <p className="text-red-500 text-sm mt-1">{errors.production_material_id}</p>
                            )}
                        </div>

                        {showNewMaterial && (
                            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nazwa materiału</label>
                                        <input value={newMaterialName} onChange={(e) => setNewMaterialName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Forma</label>
                                        <select value={newMaterialForm} onChange={(e) => setNewMaterialForm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded">
                                            {materialForms.map(mf => (
                                                <option key={mf.value} value={mf.value}>{mf.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!newMaterialName) return alert('Podaj nazwę materiału');
                                            const tokenMeta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
                                            const token = tokenMeta?.getAttribute('content') || '';
                                            try {
                                                const res = await fetch('/moderator/production-materials/quick-store', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'X-CSRF-TOKEN': token,
                                                        'Accept': 'application/json',
                                                    },
                                                    credentials: 'same-origin',
                                                    body: JSON.stringify({ name: newMaterialName, material_form: newMaterialForm }),
                                                });
                                                const json = await res.json();
                                                if (json.success && json.material) {
                                                    setMaterialsList(prev => [...prev, json.material]);
                                                    setData('production_material_id', String(json.material.id));
                                                    setShowNewMaterial(false);
                                                    setNewMaterialName('');
                                                } else {
                                                    alert(json.message || 'Błąd dodawania materiału');
                                                }
                                            } catch (e) {
                                                alert('Błąd sieci podczas tworzenia materiału');
                                            }
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Dodaj materiał
                                    </button>
                                    <button type="button" onClick={() => setShowNewMaterial(false)} className="px-4 py-2 border rounded">Anuluj</button>
                                </div>
                            </div>
                        )}

                        {/* Wymagana ilość */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Wymagana ilość
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.required_quantity}
                                    onChange={(e) => setData('required_quantity', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="np. 10.5"
                                />
                                {errors.required_quantity && (
                                    <p className="text-red-500 text-sm mt-1">{errors.required_quantity}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Jednostka
                                </label>
                                <select
                                    value={data.unit}
                                    onChange={(e) => setData('unit', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">-- Wybierz jednostkę --</option>
                                    {materialForms.map(mf => (
                                        <option key={mf.value} value={mf.value}>{mf.label}</option>
                                    ))}
                                </select>
                                {errors.unit && (
                                    <p className="text-red-500 text-sm mt-1">{errors.unit}</p>
                                )}
                            </div>
                        </div>

                        {/* Co produkuje */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Produkt (co wytwarza)
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={data.output_product_name}
                                        onChange={(e) => setData('output_product_name', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">-- Wybierz produkt --</option>
                                        {materialsList.map(material => (
                                            <option key={material.id} value={material.name}>
                                                {material.name} {material.material_form ? `(${material.material_form})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewOutputProduct(v => !v)}
                                        className="px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 whitespace-nowrap"
                                    >
                                        Inny produkt
                                    </button>
                                </div>
                                {errors.output_product_name && (
                                    <p className="text-red-500 text-sm mt-1">{errors.output_product_name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ilość wytworzona
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.output_quantity}
                                    onChange={(e) => setData('output_quantity', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="np. 3"
                                />
                                {errors.output_quantity && (
                                    <p className="text-red-500 text-sm mt-1">{errors.output_quantity}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Czas wytwarzania (sekundy)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.production_time_seconds}
                                    onChange={(e) => setData('production_time_seconds', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="np. 12.50"
                                    required
                                />
                                {errors.production_time_seconds && (
                                    <p className="text-red-500 text-sm mt-1">{errors.production_time_seconds}</p>
                                )}
                            </div>
                        </div>

                        {showNewOutputProduct && (
                            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nazwa produktu</label>
                                        <input value={newOutputProductName} onChange={(e) => setNewOutputProductName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Forma</label>
                                        <select value={newOutputProductForm} onChange={(e) => setNewOutputProductForm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded">
                                            {materialForms.map(mf => (
                                                <option key={mf.value} value={mf.value}>{mf.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!newOutputProductName) return alert('Podaj nazwę produktu');
                                            const tokenMeta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
                                            const token = tokenMeta?.getAttribute('content') || '';
                                            try {
                                                const res = await fetch('/moderator/production-materials/quick-store', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'X-CSRF-TOKEN': token,
                                                        'Accept': 'application/json',
                                                    },
                                                    credentials: 'same-origin',
                                                    body: JSON.stringify({ name: newOutputProductName, material_form: newOutputProductForm }),
                                                });
                                                const json = await res.json();
                                                if (json.success && json.material) {
                                                    setMaterialsList(prev => [...prev, json.material]);
                                                    setData('output_product_name', json.material.name);
                                                    setShowNewOutputProduct(false);
                                                    setNewOutputProductName('');
                                                } else {
                                                    alert(json.message || 'Błąd dodawania produktu');
                                                }
                                            } catch (e) {
                                                alert('Błąd sieci podczas tworzenia produktu');
                                            }
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Dodaj produkt
                                    </button>
                                    <button type="button" onClick={() => setShowNewOutputProduct(false)} className="px-4 py-2 border rounded">Anuluj</button>
                                </div>
                            </div>
                        )}

                        {/* Opis / Notatki */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Opis / Notatki
                            </label>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                rows={4}
                                placeholder="Dodaj szczegółowy opis dla tego kroku..."
                            />
                            {errors.notes && (
                                <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
                            )}
                        </div>

                        {/* Przyciski */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {processing ? 'Zapisywanie...' : 'Zapisz zmiany'}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.visit(`/moderator/items/production-schema/${item.id}`)}
                                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100"
                            >
                                Anuluj
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </ModeratorLayout>
    );
}
