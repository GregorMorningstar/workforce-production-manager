import React, { useState } from 'react';
import { router } from '@inertiajs/react';

type Repair = {
    id: number;
    status?: string | null;
    cost?: number | null;
    description?: string | null;
    started_at?: string | null;
    finished_at?: string | null;
};

type Props = {
    repair: Repair;
    onClose: () => void;
    onSaved?: (updated: Repair) => void;
};

const STATUS_MAP: Record<string, string> = {
    reported: 'Zgłoszona',
    diagnosis: 'Diagnoza',
    waiting_for_parts: 'Czeka na części',
    rejected: 'Odrzucona',
    repaired: 'Naprawiony',
    deferred: 'Odroczona',
};

export default function EditFailuresRepairedCard({ repair, onClose, onSaved }: Props) {
    const [status, setStatus] = useState(repair.status ?? 'reported');
    const [cost, setCost] = useState(repair.cost != null ? String(repair.cost) : '');
    const [description, setDescription] = useState(repair.description ?? '');
    // finished_at will be set automatically on the server for final statuses
    const [processing, setProcessing] = useState(false);
    // actions UI removed per request

    const handleSave = () => {
        setProcessing(true);
        const payload: any = {
            status,
            cost: cost === '' ? null : parseFloat(cost),
            description,
        };
        router.put(`/machines/failures/fix/${repair.id}`, payload, {
            onSuccess: (res) => {
                setProcessing(false);
                if (onSaved) onSaved({ ...repair, ...payload });
                onClose();
            },
            onError: () => {
                setProcessing(false);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 z-10">
                <h3 className="text-lg font-semibold mb-4">Edytuj naprawę #{repair.id}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border rounded">
                            {Object.entries(STATUS_MAP)
                                // Do not allow setting final statuses from the edit modal
                                .filter(([v]) => v !== 'repaired' && v !== 'rejected')
                                .map(([v, l]) => (
                                    <option key={v} value={v}>{l}</option>
                                ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Koszt (PLN)</label>
                        <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} className="w-full px-3 py-2 border rounded" />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Opis</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded min-h-[120px]" />
                    </div>

                    {/* Finished date removed from form: server sets it automatically when needed */}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 border rounded">Anuluj</button>
                    <button onClick={handleSave} disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{processing ? 'Zapis...' : 'Zapisz'}</button>
                </div>
                {/* repair actions removed */}
            </div>
        </div>
    );
}
