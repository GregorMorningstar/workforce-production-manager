import { useState } from 'react';
import { useForm } from '@inertiajs/react';

export default function CreateNewFailure({ machineId }: { machineId: number | null }) {
    const { data, setData, post, processing, errors } = useForm({
        machine_id: machineId ?? '',
        failure_rank: 1,
        failure_description: '',
    });

    const [hover, setHover] = useState<number | null>(null);

    const yellow = { r: 255, g: 213, b: 79 };
    const red = { r: 211, g: 47, b: 47 };

    function interpColor(index: number) {
        const t = index / 9; // 0..1 across 10 stars
        const r = Math.round(yellow.r + (red.r - yellow.r) * t);
        const g = Math.round(yellow.g + (red.g - yellow.g) * t);
        const b = Math.round(yellow.b + (red.b - yellow.b) * t);
        return `rgb(${r}, ${g}, ${b})`;
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/machines/failures');
    }

    return (
        <form onSubmit={submit} className="p-4">
            <div className="mb-3">
                <label className="block mb-1 font-medium">Ocena awarii</label>
                <div>
                    {Array.from({ length: 10 }).map((_, i) => {
                        const idx = i + 1;
                        const filled = idx <= (hover ?? data.failure_rank);
                        const color = filled ? interpColor(i) : '#e0e0e0';
                        return (
                            <span
                                key={idx}
                                onMouseEnter={() => setHover(idx)}
                                onMouseLeave={() => setHover(null)}
                                onClick={() => setData('failure_rank', idx)}
                                style={{
                                    cursor: 'pointer',
                                    color,
                                    fontSize: 24,
                                    transition: 'color 120ms',
                                    marginRight: 4,
                                }}
                                aria-label={`${idx} gwiazdek`}
                            >
                                ★
                            </span>
                        );
                    })}
                </div>
                {errors.failure_rank && <div className="text-red-600">{errors.failure_rank}</div>}
            </div>

            <div className="mb-3">
                <label className="block mb-1 font-medium">Opis usterki</label>
                <textarea
                    value={data.failure_description}
                    onChange={(e) => setData('failure_description', e.target.value)}
                    rows={6}
                    className="w-full border rounded p-2"
                    placeholder="Opisz usterkę (co się dzieje, kiedy występuje, jak ją odtworzyć)"
                />
                {errors.failure_description && <div className="text-red-600">{errors.failure_description}</div>}
            </div>

            <input type="hidden" value={data.machine_id} />

            <div>
                <button type="submit" disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded">
                    Zgłoś awarię
                </button>
            </div>
        </form>
    );
}


