import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { faFile, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface EventData {
    id?: string | number;
    title?: string | null;
    start?: Date | string | null;
    end?: Date | string | null;
    allDay?: boolean;
    type?: string | null;
    type_label?: string | null;
    description?: string | null;
    color?: string | null;
}
type Props = {
    event: EventData;
    
    onClose?: () => void;
};

export default function EventVacationCard({ event, onClose,  }: Props) {
    const fmt = (d?: Date | string | null) => (d ? new Date(d).toLocaleDateString('pl-PL') : '-');

    const TYPE_COLORS: Record<string, string> = {
        annual: '#22c55e',
        sick: '#ef4444',
        unpaid: '#9ca3af',
        maternity: '#f59e0b',
        paternity: '#06b6d4',
        compassionate: '#8b5cf6',
        study: '#3b82f6',
        requested: '#ef6b6b',
        casual: '#f97316',
    };

    const color = event.color ?? (event.type_label ? (TYPE_COLORS[event.type_label] ?? '#0f172a') : '#0f172a');

    return (
        <div
            className="p-4 relative pb-16"
            onClick={(e) => e.stopPropagation()}
            style={{ borderLeft: `4px solid ${color}` }}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold mb-1 text-slate-900">{event.title ?? 'Brak tytułu'}</h3>
                    <div className="inline-flex items-center gap-2">
                       
                        <div className="text-sm text-slate-500">{event.type_label ?? (event.type_label ?? '')}</div>
                    </div>
                </div>

                {onClose && (
                    <button
                        onClick={() => onClose()}
                        className="text-slate-500 hover:text-slate-700 rounded-md p-1"
                        aria-label="Zamknij"
                    >
                        ×
                    </button>
                )}
            </div>



            <div className="mt-3 text-sm text-slate-700 space-y-2">
                <div><strong>Data rozpoczęcia:</strong> {fmt(event.start)}</div>
                <div><strong>Data zakończenia:</strong> {fmt(event.end)}</div>
                <div><strong>Opis:</strong> {event.description ?? 'Brak opisu'}</div>
            </div>
            <hr className="mt-4" />

            <div className="absolute bottom-3 right-3 flex gap-2">
                <Link href='#' className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white border shadow-sm hover:bg-slate-50">
                    <FontAwesomeIcon icon={faFile} className='text-green-500' />
                </Link>
                <Link href='#' className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white border shadow-sm hover:bg-slate-50">
                    <FontAwesomeIcon icon={faEdit} className='text-blue-500' />
                </Link>
                <Link href='#' className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white border shadow-sm hover:bg-slate-50">
                    <FontAwesomeIcon icon={faTrash} className='text-red-500' />
                </Link>
            </div>
        </div>
    );
}
