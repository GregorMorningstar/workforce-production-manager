import React, { useState, useEffect } from 'react';
import ModeratorLayout from '@/layouts/ModeratorLayout';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { usePage, Link, router } from '@inertiajs/react';

interface Step {
    id: number;
    step_number: number;
    machine?: { id: number; name: string; serial_number?: string; model?: string; status?: string };
    operation?: { id: number; operation_name: string; changeover_time?: number };
    material?: { id: number; name: string };
    required_quantity?: number;
    unit?: string;
    output_product_name?: string;
    output_quantity?: number;
    notes?: string;
}

interface Schema {
    id: number;
    name: string;
    steps?: Step[];
}

interface MachineStatusInfo {
    value: string;
    label: string;
    classes: string;
    color: string;
}

export default function ProductionPlanSchemaByItem() {
const breadcrumbsModerator = [
    { label: 'Home', href: '/moderator' },
    { label: 'Produkty gotowe', href: '/moderator/items' },
    { label: 'Schemat produkcji', href: '#' },
];

const breadcrumbsEmployee = [
    { label: 'Home', href: '/employee' },
    { label: 'Produkty gotowe', href: '/employee/items' },
    { label: 'Schemat produkcji', href: '#' },
];

    const page = usePage();
    const props = page.props as any;
    const schema = props.schema as Schema | null;
    const [stepsState, setStepsState] = useState<Step[]>(schema?.steps ?? []);

    useEffect(() => {
        setStepsState(schema?.steps ?? []);
    }, [schema]);
    const itemId = props.itemId ?? null;
    const machineStatusMap = (props.machineStatusMap || []) as MachineStatusInfo[];

    const rawRole = props?.auth?.user?.role ?? '';
    const userRole = String(rawRole).toLowerCase();
    const [hideFinalTriangle, setHideFinalTriangle] = useState(false);

    const handleDelete = (stepId: number) => {
        if (confirm('Czy na pewno chcesz usunąć ten krok?')) {
            router.delete(`/moderator/items/production-schema/step/${stepId}`, {
                preserveScroll: true,
            });
        }
    };

    // Funkcja zwracająca informacje o statusie maszyny z enuma
    const getMachineStatusInfo = (status?: string): MachineStatusInfo | null => {
        if (!status) return null;
        return machineStatusMap.find(s => s.value === status) || null;
    };

    // Komponent do wyświetlania pojedynczego kroku
    const StepCard = ({ step, isLast, showActions }: { step: Step; isLast: boolean; showActions: boolean }) => {
        const statusInfo = getMachineStatusInfo(step.machine?.status);

        // Helper: convert hex to rgba for subtle background
        const hexToRgba = (hex?: string, alpha = 0.12) => {
            if (!hex) return undefined;
            const h = hex.replace('#', '');
            const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
            const bigint = parseInt(full, 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        const borderColor = statusInfo?.color;
        const backgroundColor = statusInfo?.color ? hexToRgba(statusInfo.color, 0.12) : undefined;
        const badgeClasses = statusInfo?.classes ?? 'bg-yellow-100 text-yellow-800';
        const textClass = (badgeClasses.split(' ').find(c => c.startsWith('text-')) as string) || 'text-gray-800';

        return (
        <div className="flex items-center">
            <div
                className={`border-2 rounded-lg p-4 min-w-[200px] shadow-md ${textClass}`}
                style={{ borderColor: borderColor ?? undefined, backgroundColor: backgroundColor ?? undefined }}
            >
                <div className="text-center">
                    <div className="text-xs font-semibold text-gray-500 mb-2">
                        KROK {step.step_number}
                    </div>

                    {/* Ikona maszyny i nazwa */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                        <div className="font-bold text-gray-800">
                            {step.machine?.name || 'Brak maszyny'}
                        </div>
                    </div>

                    {step.machine?.serial_number && (
                        <div className="text-xs text-gray-600 mb-2">
                            SN: {step.machine.serial_number}
                        </div>
                    )}

                    {/* Status maszyny */}
                    {statusInfo && (
                        <div className="mb-2">
                            <span className={`${badgeClasses} text-xs px-2 py-1 rounded font-semibold`}>
                                {statusInfo.label}
                            </span>
                        </div>
                    )}

                    {step.operation && (
                        <div className="text-sm text-blue-700 font-medium mb-2">
                            {step.operation.operation_name}
                            {step.operation.changeover_time && (
                                <div className="text-xs text-gray-600 mt-1">
                                    ⏱ {step.operation.changeover_time} sek
                                </div>
                            )}
                        </div>
                    )}
                    {step.material && (
                        <div className="text-xs text-gray-700 bg-white rounded px-2 py-1 mt-2">
                            <div className="font-semibold">Pobiera:</div>
                            <div className="font-medium">{step.material.name}</div>
                            {step.required_quantity && (
                                <div className="text-gray-600">
                                    {step.required_quantity} {step.unit || ''}
                                </div>
                            )}
                        </div>
                    )}
                    {step.output_product_name && (
                        <div className="text-xs text-green-700 bg-green-50 rounded px-2 py-1 mt-2">
                            <div className="font-semibold">Wytwarza:</div>
                            <div className="font-medium">{step.output_product_name}</div>
                            {step.output_quantity && (
                                <div className="text-gray-600">
                                    {step.output_quantity} szt.
                                </div>
                            )}
                        </div>
                    )}
                    {step.notes && (
                        <div className="text-xs text-gray-500 mt-2 italic">
                            {step.notes}
                        </div>
                    )}

                    {showActions && (
                        <div className="flex gap-2 mt-3 justify-center">
                            <Link
                                href={`/moderator/items/production-schema/step/${step.id}/edit`}
                                className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                            >
                                Edytuj
                            </Link>
                            <button
                                onClick={() => handleDelete(step.id)}
                                className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                            >
                                Usuń
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {!isLast && (
                <div className="flex items-center mx-2">
                    <div className="w-0 h-0 border-t-[20px] border-t-transparent border-b-[20px] border-b-transparent border-l-[30px] border-l-red-500"></div>
                </div>
            )}
        </div>
    );
    };

    // Komponent głównego widoku schematu
    const SchemaView = () => {
        if (!schema || !schema.steps || schema.steps.length === 0) {
            return (
                <div className="bg-white p-8 rounded shadow text-center">
                    <h2 className="text-xl font-semibold mb-4">Brak kroków w schemacie</h2>
                    <p className="text-gray-600 mb-6">Schemat istnieje, ale nie zawiera żadnych kroków produkcyjnych.</p>
                    <Link
                        href={`/moderator/items/production-schema/${itemId}/create-step`}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Dodaj pierwszy krok
                    </Link>
                </div>
            );
        }

        return (
            <div className="bg-white p-6 rounded shadow">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">
                        {schema.name}
                    </h2>
                    {userRole === 'moderator' && (
                        <div className="flex items-center gap-3">
                            <label className="inline-flex items-center text-sm mr-2">
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    checked={hideFinalTriangle}
                                    onChange={(e) => setHideFinalTriangle(e.target.checked)}
                                />
                                Na koniec procesu
                            </label>
                            {hideFinalTriangle ? (
                                <button
                                    type="button"
                                    disabled
                                    className="px-4 py-2 bg-green-600 text-white rounded opacity-50 cursor-not-allowed"
                                >
                                    + Dodaj kolejny krok
                                </button>
                            ) : (
                                <Link
                                    href={`/moderator/items/production-schema/${itemId}/create-step`}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    + Dodaj kolejny krok
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-2 border-gray-300 rounded-lg p-6 bg-gradient-to-b from-gray-50 to-white">
                    <div className="text-center mb-4 py-2 bg-yellow-200 border-2 border-yellow-600 rounded-lg">
                        <h3 className="text-lg font-bold text-gray-800">
                            Schemat produkcji dla produktu: {schema.name}
                        </h3>
                    </div>

                    <div className="flex items-center justify-start overflow-x-auto pb-4">
                            {stepsState.map((step, index) => (
                                <div
                                    key={step.id}
                                    draggable={userRole === 'moderator'}
                                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(index)); }}
                                    onDragOver={(e) => { e.preventDefault(); }}
                                    onDrop={async (e) => {
                                        e.preventDefault();
                                        const dragIndex = Number(e.dataTransfer.getData('text/plain'));
                                        const dropIndex = index;
                                        if (Number.isNaN(dragIndex)) return;
                                        if (dragIndex === dropIndex) return;
                                        const newSteps = [...stepsState];
                                        const [moved] = newSteps.splice(dragIndex, 1);
                                        newSteps.splice(dropIndex, 0, moved);
                                        // update local numbers
                                        const renumbered = newSteps.map((s, i) => ({ ...s, step_number: i + 1 }));
                                        setStepsState(renumbered);

                                        // persist to server
                                        try {
                                            const tokenMeta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
                                            const token = tokenMeta?.getAttribute('content') || '';
                                            const res = await fetch(`/moderator/items/production-schema/${itemId}/reorder-steps`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'X-CSRF-TOKEN': token,
                                                    'Accept': 'application/json',
                                                },
                                                credentials: 'same-origin',
                                                body: JSON.stringify({ ordered_ids: renumbered.map(s => s.id) }),
                                            });
                                            if (!res.ok) {
                                                // reload original schema on failure
                                                setStepsState(schema?.steps ?? []);
                                                console.error('Failed to save new order');
                                            }
                                        } catch (err) {
                                            setStepsState(schema?.steps ?? []);
                                            console.error(err);
                                        }
                                    }}
                                >
                                    <StepCard
                                        step={step}
                                        isLast={index === stepsState.length - 1}
                                        showActions={userRole === 'moderator'}
                                    />
                                </div>
                            ))}

                            {/* Finished Goods Store - can be hidden by moderator */}
                            {!hideFinalTriangle && (
                                <div className="flex items-center ml-2">
                                    <div className="w-0 h-0 border-l-[60px] border-l-red-500 border-t-[40px] border-t-transparent border-b-[40px] border-b-transparent flex items-center justify-center relative">
                                        <span className="absolute left-2 text-xs text-white font-semibold whitespace-nowrap">
                                            Gotowy
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                    <div className="mt-6 text-sm text-gray-600 space-y-1">
                        <div className="flex items-center">
                            <span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
                            <span>Zsynchronizowany przepływ materiałów i informacji</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
                            <span>Zaplanowana produkcja</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
                            <span>Scentralizowane zlecenia pracy</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (userRole === 'moderator') {
        return (
            <ModeratorLayout breadcrumbs={breadcrumbsModerator} title="Schemat produkcji">
                <div className="p-6">
                    {!schema ? (
                        <div className="bg-white p-8 rounded shadow text-center">
                            <h2 className="text-xl font-semibold mb-4">Brak schematu produkcji</h2>
                            <p className="text-gray-600 mb-6">Dla tego produktu nie utworzono jeszcze schematu produkcji.</p>
                            <Link
                                href={`/moderator/items/production-schema/${itemId}/create-step`}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Dodaj schemat produkcji
                            </Link>
                        </div>
                    ) : (
                        <SchemaView />
                    )}
                </div>
            </ModeratorLayout>
        );
    }

    if (userRole === 'employee') {
        return (
            <EmployeeLayout breadcrumbs={breadcrumbsEmployee} title="Schemat produkcji">
                <div className="p-6">
                    {!schema ? (
                        <div className="bg-white p-8 rounded shadow text-center">
                            <h2 className="text-xl font-semibold mb-4">Brak schematu produkcji</h2>
                            <p className="text-gray-600 mb-6">Dla tego produktu nie utworzono jeszcze schematu produkcji.</p>
                        </div>
                    ) : (
                        <SchemaView />
                    )}
                </div>
            </EmployeeLayout>
        );
    }

    return null;
}
