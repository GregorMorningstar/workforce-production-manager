import React, { useEffect, useState } from 'react';
import ModeratorLayout from "@/layouts/ModeratorLayout";
import { usePage, useForm, Link, router } from "@inertiajs/react";
import ReactBarcode from "react-barcode";
import ConfirmDialog from '@/components/ui/ConfirmDialog';

type Payload = {
    operation_name?: string;
    description?: string;
    changeover_time?: number | null;
};

function translateStatus(status?: string) {
    if (!status) return '-';
    const map: Record<string, string> = {
        working: 'Pracuje',
        breakdown: 'Awaria',
        active: 'Aktywna',
        inactive: 'Nieaktywna',
        maintenance: 'Serwis / konserwacja',
        decommissioned: 'Wycofana',
        forced_downtime: 'Postój wymuszony',
    };
    return map[String(status).toLowerCase()] ?? String(status);
}

export default function MachineOperationEdit() {
    const breadcrumbs = [
        { label: "Dashboard", href: "/moderator/dashboard" },
        { label: "Machines", href: "/moderator/machines" },
        { label: "Operations", href: "/moderator/machines/operations" },
        { label: "Edytuj", href: `/moderator/machines/operations/edit` },
    ];

    const page = usePage();
    const findOperation = (page as any)?.props?.findOperation ?? null;
    const urlId = window.location.pathname.match(/\/operationmachines\/(\d+)\/edit/)?.[1] ?? null;
    const id = findOperation?.id ?? findOperation?.operation_id ?? urlId;

    const { data, setData, put, processing, errors } = useForm<Payload>({
        operation_name: findOperation?.operation_name ?? findOperation?.operation?.name ?? '',
        description: findOperation?.description ?? findOperation?.operation?.description ?? '',
        changeover_time: (findOperation?.changeover_time ?? findOperation?.operation?.changeover_time) ?? null,
    });

    const [deleteOpen, setDeleteOpen] = useState(false);

    useEffect(() => {
        if (!findOperation) return;
        setData({
            operation_name: findOperation.operation_name ?? findOperation.operation?.name ?? '',
            description: findOperation.description ?? findOperation.operation?.description ?? '',
            changeover_time: (findOperation.changeover_time ?? findOperation.operation?.changeover_time) ?? null,
        });
    }, [findOperation, setData]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        put(`/moderator/machines/operations/${id}`, {
            onSuccess: () => {
                // optional success handling
            },
        });
    };

    function handleDestroy() {
        if (!id) {
            setDeleteOpen(false);
            return;
        }

        // use direct route path (matches routes/web.php)
        const deleteUrl = `/moderator/machines/operations/${id}`;

        router.delete(deleteUrl, {
            onStart: () => { /* optional: show spinner */ },
            onSuccess: () => {
                setDeleteOpen(false);
                router.visit('/moderator/machines/operations');
            },
            onError: () => {
                setDeleteOpen(false);
            },
        });
    }

    return (
        <ModeratorLayout breadcrumbs={breadcrumbs} title={`Edytuj operację`}>
            <div className="py-8">
                <div className="mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* left column: machine info */}
                    <aside className="md:col-span-1 bg-white shadow p-4 rounded">
                        <h3 className="text-sm font-medium mb-3">Maszyna</h3>
                        <div className="space-y-4 text-sm">
                            <div>
                                <div className="text-xs text-slate-500">Nazwa</div>
                                <div className="font-medium">
                                    {(findOperation?.machine?.name) ?? (findOperation?.machine_name) ?? '-'}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-slate-500">Wydział</div>
                                <div className="font-medium">
                                    {(findOperation?.machine?.department?.name) ?? (findOperation?.machine_department_name) ?? '-'}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-slate-500">Barcode</div>
                                <div className="font-medium">
                                    {(findOperation?.machine?.barcode) ?? (findOperation?.machine_barcode) ?? '-'}
                                </div>
                                {findOperation?.machine?.barcode ? (
                                    <div className="mt-2">
                                        <ReactBarcode
                                            value={String(findOperation.machine.barcode)}
                                            format="CODE128"
                                            width={2}
                                            height={50}
                                            displayValue={true}
                                        />
                                    </div>
                                ) : null}
                            </div>

                            <div>
                                <div className="text-xs text-slate-500">Serial number</div>
                                <div className="font-medium">
                                    {(findOperation?.machine?.serial_number) ?? (findOperation?.machine_serial) ?? '-'}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-slate-500">Status</div>
                                <div className="inline-block px-2 py-1 rounded text-sm bg-slate-100">
                                    {translateStatus((findOperation?.machine?.status) ?? (findOperation?.machine_status) ?? '')}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* right column: form */}
                    <main className="md:col-span-2">
                        <div className="bg-white shadow p-6 rounded">
                            <h2 className="text-lg font-medium mb-4">Edycja operacji</h2>

                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nazwa operacji</label>
                                    <input
                                        className="w-full border px-3 py-2 rounded"
                                        value={data.operation_name ?? ""}
                                        onChange={(e) => setData('operation_name', e.target.value)}
                                        required
                                    />
                                    {errors.operation_name && <div className="text-xs text-red-600 mt-1">{String(errors.operation_name)}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Opis</label>
                                    <textarea
                                        className="w-full border px-3 py-2 rounded"
                                        value={data.description ?? ""}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={4}
                                    />
                                    {errors.description && <div className="text-xs text-red-600 mt-1">{String(errors.description)}</div>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Czas przezbrojenia (sekund)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            className="w-full border px-3 py-2 rounded"
                                            value={data.changeover_time ?? ""}
                                            onChange={(e) =>
                                                setData('changeover_time', e.target.value === "" ? null : Number(e.target.value))
                                            }
                                        />
                                        {errors.changeover_time && <div className="text-xs text-red-600 mt-1">{String(errors.changeover_time)}</div>}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    <Link href="/moderator/machines/operations" className="px-4 py-2 border rounded">
                                        Anuluj
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setDeleteOpen(true)}
                                            className="px-4 py-2 bg-red-600 text-white rounded"
                                        >
                                            Usuń
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-4 py-2 bg-blue-600 text-white rounded"
                                        >
                                            {processing ? "Zapis..." : "Zapisz"}
                                        </button>
                                    </div>
                                </div>
                                <ConfirmDialog
                                    open={deleteOpen}
                                    onClose={() => setDeleteOpen(false)}
                                    onConfirm={handleDestroy}
                                    title="Usuń operację"
                                    message={`Czy na pewno usunąć operację "${data.operation_name ?? (findOperation?.operation?.name ?? '')}"?`}
                                    confirmText="Usuń"
                                    cancelText="Anuluj"
                                />
                            </form>
                        </div>
                    </main>
                </div>
            </div>
        </ModeratorLayout>
    );
}
