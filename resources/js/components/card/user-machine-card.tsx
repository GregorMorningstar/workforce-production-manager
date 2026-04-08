import React, { useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import Barcode from 'react-barcode';

export default function UserMachinesCard({ userMachines: propUserMachines }: { userMachines?: any }) {
    const page = usePage<any>();
    const raw = propUserMachines ?? page.props?.machines ?? [];
    const userMachines: any[] = Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data) ? raw.data : []);
    const [expandedOpsMap, setExpandedOpsMap] = useState<Record<string|number, number | null>>({});
    const [expandedFailMap, setExpandedFailMap] = useState<Record<string|number, number | null>>({});

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Maszyny użytkownika</h2>
            {userMachines.length === 0 ? (
                <p className="text-sm text-gray-500">Brak przypisanych maszyn.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userMachines.map((machine: any) => {
                        const operations = machine.operations ?? [];
                        const failures = machine.machineFailures ?? [];
                        const expandedOps = expandedOpsMap[machine.id] ?? null;
                        const expandedFail = expandedFailMap[machine.id] ?? null;

                        return (
                            <div key={machine.id ?? machine.name} className="bg-gray-50 p-4 rounded shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg">{machine.name ?? 'Maszyna'}</h3>
                                        <p className="text-sm text-gray-500">Wydział: {machine.department?.name ?? '—'}</p>
                                    </div>
                                    <div className="text-right">
                                        {machine.barcode ? (
                                            <div className="inline-block">
                                                <Barcode value={String(machine.barcode)} width={1} height={40} displayValue={false} />
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400">Brak kodu</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-3 flex gap-4">
                                    <div className="px-3 py-2 bg-white rounded border">
                                        <div className="text-sm text-gray-500">Operacje</div>
                                        <div className="font-medium">{operations.length}</div>
                                    </div>
                                    <div className="px-3 py-2 bg-white rounded border">
                                        <div className="text-sm text-gray-500">Awarie</div>
                                        <div className="font-medium">{failures.length}</div>
                                    </div>
                                    <div className="px-3 py-2 bg-white rounded border">
                                        <div className="text-sm text-gray-500">m</div>
                                        <div className="font-medium">{(operations.length ?? 0) + (failures.length ?? 0)}</div>
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <Link
                                        href={`/machines/failures/add-new/${machine.id}`}
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded shadow-sm hover:bg-red-100"
                                    >
                                        Zgłoś awarię
                                    </Link>
                                </div>

                                <div className="mt-4 text-sm">
                                    <div className="mb-2 font-semibold">Szczegóły</div>
                                    <div className="bg-white border rounded">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Typ</th>
                                                    <th className="px-3 py-2 text-left">Nazwa</th>
                                                    <th className="px-3 py-2 text-left">Akcja</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {failures.map((f: any) => (
                                                    <React.Fragment key={`f-${f.id}`}>
                                                        <tr className="border-t hover:bg-gray-50">
                                                            <td className="px-3 py-2">Awarie</td>
                                                            <td className="px-3 py-2">{f.title ?? f.name ?? 'Awaria'}</td>
                                                            <td className="px-3 py-2">
                                                                <button
                                                                    className="text-indigo-600 hover:underline"
                                                                    onClick={() => setExpandedFailMap(prev => ({ ...prev, [machine.id]: prev[machine.id] === f.id ? null : f.id }))}
                                                                >
                                                                    {expandedFail === f.id ? 'Zwiń' : 'Pokaż'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                        {expandedFail === f.id && (
                                                            <tr className="bg-gray-50">
                                                                <td colSpan={3} className="px-3 py-2 text-gray-700">
                                                                    <div className="text-sm">Opis: {f.description ?? 'Brak opisu'}</div>
                                                                    <div className="text-xs text-gray-500">Data: {f.created_at ?? f.date ?? '—'}</div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ))}

                                                {operations.map((op: any) => (
                                                    <React.Fragment key={`o-${op.id}`}>
                                                        <tr className="border-t hover:bg-gray-50">
                                                            <td className="px-3 py-2">Operacja</td>
                                                            <td className="px-3 py-2">{op.title ?? op.name ?? 'Operacja'}</td>
                                                            <td className="px-3 py-2">
                                                                <button
                                                                    className="text-indigo-600 hover:underline"
                                                                    onClick={() => setExpandedOpsMap(prev => ({ ...prev, [machine.id]: prev[machine.id] === op.id ? null : op.id }))}
                                                                >
                                                                    {expandedOps === op.id ? 'Zwiń' : 'Pokaż'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                        {expandedOps === op.id && (
                                                            <tr className="bg-gray-50">
                                                                <td colSpan={3} className="px-3 py-2 text-gray-700">
                                                                    <div className="text-sm">Opis: {op.description ?? 'Brak opisu'}</div>
                                                                    <div className="text-xs text-gray-500">Data: {op.created_at ?? op.date ?? '—'}</div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

        </div>
    );
}
