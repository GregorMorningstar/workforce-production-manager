import React, { useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import ModeratorLayout from '@/layouts/ModeratorLayout';
import Barcode from 'react-barcode';

type Employee = {
    id: number;
    name: string;
    machine_id?: number | null;
};

type Step = {
    id: number;
    step_number: number;
    operation_name?: string | null;
    machine_id?: number | null;
    machine_name?: string | null;
    material_name?: string | null;
    required_quantity?: number | null;
    production_time_seconds?: number | null;
    total_time_seconds?: number | null;
    changeover_applied?: boolean;
    unit?: string | null;
    assigned_user_id?: number | null;
};

type OrderItemSchema = {
    order_item_id: number;
    model_name?: string | null;
    quantity: number;
    schema_name?: string | null;
    steps: Step[];
};

type PageProps = {
    order: {
        id: number;
        barcode?: string | null;
        customer_name: string;
        planned_production_at?: string | null;
        finished_at?: string | null;
    };
    orderItems: OrderItemSchema[];
    employees: Employee[];
};

type AssignmentSummary = {
    user_id: number;
    user_name: string;
    steps_count: number;
    items_count: number;
};

type SharedPageProps = {
    flash?: {
        success?: string | null;
        error?: string | null;
        assignment_summary?: AssignmentSummary[];
    };
};

type AssignmentMap = Record<string, number | ''>;

const fmt = (value?: string | null) => value || '-';
const formatDuration = (seconds?: number | null) => {
    if (!seconds || seconds <= 0) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
};

export default function OrderSchemaPlanning({ order, orderItems, employees }: PageProps) {
    const { flash } = usePage<SharedPageProps>().props;
    const assignmentSummary = flash?.assignment_summary ?? [];

    const breadcrumbs = [
        { label: 'Home', href: '/moderator' },
        { label: 'Planowanie produkcji', href: '/moderator/production/planning' },
        { label: `Schemat zamówienia #${order.id}`, href: '#' },
    ];

    const initialAssignments = useMemo<AssignmentMap>(() => {
        const map: AssignmentMap = {};

        orderItems.forEach((item) => {
            item.steps.forEach((step) => {
                const key = `${item.order_item_id}-${step.id}`;
                if (step.assigned_user_id) {
                    map[key] = step.assigned_user_id;
                    return;
                }

                const selected = employees.find((employee) => employee.machine_id === step.machine_id);
                map[key] = selected ? selected.id : '';
            });
        });

        return map;
    }, [orderItems, employees]);

    const [assignments, setAssignments] = useState<AssignmentMap>(initialAssignments);

    const handleSelect = (orderItemId: number, stepId: number, value: string) => {
        const key = `${orderItemId}-${stepId}`;
        setAssignments((prev) => ({
            ...prev,
            [key]: value ? Number(value) : '',
        }));
    };

    const handleSave = () => {
        const payload: Array<{
            order_item_id: number;
            step_id: number;
            machine_id: number | null;
            user_id: number | null;
        }> = [];

        orderItems.forEach((item) => {
            item.steps.forEach((step) => {
                const key = `${item.order_item_id}-${step.id}`;
                const selectedUser = assignments[key];
                payload.push({
                    order_item_id: item.order_item_id,
                    step_id: step.id,
                    machine_id: step.machine_id ?? null,
                    user_id: selectedUser === '' ? null : Number(selectedUser),
                });
            });
        });

        router.post(`/moderator/production/planning/orders/${order.id}/assign-operators`, {
            assignments: payload,
        });
    };

    return (
        <ModeratorLayout breadcrumbs={breadcrumbs} title={`Schemat zamówienia #${order.id}`}>
            <div className="space-y-4">
                <div className="bg-emerald-100 rounded p-4 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="bg-white rounded p-2 border w-fit">
                        <Barcode value={String(order.barcode ?? order.id)} format="CODE128" width={1.2} height={56} />
                    </div>

                    <div className="space-y-1 text-sm">
                        <p><span className="font-semibold">Klient:</span> {order.customer_name}</p>
                        <p><span className="font-semibold">Data planowanego startu:</span> {fmt(order.planned_production_at)}</p>
                        <p><span className="font-semibold">Data planowanego zakończenia:</span> {fmt(order.finished_at)}</p>
                        <p><span className="font-semibold">Start produkcji:</span> od daty planowanego startu</p>
                    </div>
                </div>

                {assignmentSummary.length > 0 && (
                    <div className="bg-white rounded shadow p-4 border">
                        <h3 className="text-base font-semibold mb-2">Podsumowanie przypisań</h3>
                        <ul className="text-sm text-gray-700 space-y-1">
                            {assignmentSummary.map((row) => (
                                <li key={row.user_id}>
                                    {row.user_name}: kroki {row.steps_count}, modele {row.items_count}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {orderItems.map((item) => (
                    <div key={item.order_item_id} className="bg-white rounded shadow p-4 border">
                        <div className="mb-3">
                            <h2 className="text-lg font-semibold">Model: {item.model_name ?? '-'}</h2>
                            <p className="text-sm text-gray-600">Ilość przedmiotów: {item.quantity}</p>
                            <p className="text-sm text-gray-600">Schemat produkcji: {item.schema_name ?? 'Brak schematu'}</p>
                        </div>

                        {item.steps.length === 0 ? (
                            <div className="text-sm text-amber-700">Brak kroków schematu dla tego modelu.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Krok</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Operacja</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Maszyna</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Materiał</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ilość / szt.</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Czas</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Przezbrojenie</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Przypisz osobę</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {item.steps.map((step) => {
                                            const key = `${item.order_item_id}-${step.id}`;
                                            return (
                                                <tr key={step.id} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2">{step.step_number}</td>
                                                    <td className="px-3 py-2">{step.operation_name ?? '-'}</td>
                                                    <td className="px-3 py-2">{step.machine_name ?? '-'}</td>
                                                    <td className="px-3 py-2">{step.material_name ?? '-'}</td>
                                                    <td className="px-3 py-2">{step.required_quantity ?? 0} {step.unit ?? ''}</td>
                                                    <td className="px-3 py-2">{formatDuration(step.total_time_seconds ?? step.production_time_seconds)}</td>
                                                    <td className="px-3 py-2">{step.changeover_applied ? 'TAK' : 'NIE'}</td>
                                                    <td className="px-3 py-2">
                                                        <select
                                                            className="border rounded px-2 py-1 text-sm min-w-[220px]"
                                                            value={assignments[key]}
                                                            onChange={(e) => handleSelect(item.order_item_id, step.id, e.target.value)}
                                                            disabled={!step.machine_id}
                                                        >
                                                            <option value="">Wybierz osobę</option>
                                                            {employees.map((employee) => (
                                                                <option key={employee.id} value={employee.id}>
                                                                    {employee.name}{step.assigned_user_id === employee.id ? ' (aktualny pracownik)' : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        Zapisz przypisania
                    </button>
                    <Link href="/moderator/production/planning" className="px-4 py-2 rounded border hover:bg-gray-50">
                        Wróć do planowania
                    </Link>
                </div>
            </div>
        </ModeratorLayout>
    );
}
