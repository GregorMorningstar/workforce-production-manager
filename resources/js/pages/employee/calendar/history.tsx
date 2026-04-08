import EmployeeLayout from "@/layouts/EmployeeLayout";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import plLocale from '@fullcalendar/core/locales/pl';
import { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';

export default function EmployeeCalendarHistory() {
    const breadcrumbs = [
        {label: 'Panel pracownika', href : ('employee/dashboard') },
        { label: 'Kalendarz pracownika', href : ('employee/calendar') },
        { label: 'Historia zmian', href : ('employee/calendar/history') },
    ];


const { props: pageProps } = usePage<any>();
    const userLeaves = pageProps?.usedLeaves ?? [];

    const calendarRef = useRef<any>(null);
    const [events, setEvents] = useState<any[]>([]);

    const mapLeavesToEvents = (leaves: any[]) => leaves
        .filter(l => {
            if (!l.end_date) return true;
            const today = new Date();
            const end = new Date(l.end_date);
            return end < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        })
        .map(l => {
            const status = l.status || 'pending';
            const statusLabel = (status === 'approved') ? 'ZATWIERDZONY' : (status === 'rejected') ? 'ODRZUCONY' : (status === 'cancelled') ? 'ANULOWANY' : 'OCZEKUJĄCY';
            const statusBg = (status === 'approved') ? '#059669' : (status === 'rejected') ? '#dc2626' : (status === 'cancelled') ? '#d97706' : '#4b5563';
            const typeLabel = l.type_label || l.type || 'Urlop';
            let title = `<span class="status-badge" style="background-color: ${statusBg}; padding: 1px 6px; border-radius: 3px; margin-right: 6px; font-size:0.7rem; font-weight:700;color:#fff">${statusLabel}</span>${typeLabel}`;
            if (l.description) title += `: ${l.description}`;

            return {
                id: String(l.id),
                title: title,
                start: l.start_date ?? l.start,
                end: l.end_date ?? l.end,
                allDay: true,
                backgroundColor: '#3b82f6',
                borderColor: '#3b82f6',
                textColor: '#ffffff',
                extendedProps: {
                    status: status,
                    description: l.description,
                },
                classNames: ['leave-event', `status-border-${status}`]
            };
        });

    useEffect(() => {
        setEvents(mapLeavesToEvents(userLeaves));
    }, [JSON.stringify(userLeaves)]);

    // Pagination state for left table
    const ITEMS_PER_PAGE = 8;
    const [page, setPage] = useState<number>(1);

    const sortedLeaves = [...userLeaves].sort((a: any, b: any) => (b.start_date ?? b.start) > (a.start_date ?? a.start) ? 1 : -1);
    const totalPages = Math.max(1, Math.ceil(sortedLeaves.length / ITEMS_PER_PAGE));
    const paginatedLeaves = sortedLeaves.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const goToCalendarDate = (dateStr: string) => {
        if (!dateStr) return;
        const d = (dateStr.length > 10) ? dateStr.split('T')[0] : dateStr;
        window.location.href = `/employee/calendar?date=${d}`;
    };

    return (
       <EmployeeLayout title="Kalendarz pracownika" breadcrumbs={breadcrumbs}>
            <div className="card mb-4">
                <div className="card-body">

                    <div className="flex gap-4">
                        <div className="w-1/3">
                            <div className="overflow-hidden rounded-lg border">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Koniec</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Akcje</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {paginatedLeaves.map((leave: any) => (
                                            <tr key={leave.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-sm text-gray-700">{(leave.start_date ?? leave.start)?.split('T')?.[0]}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700">{(leave.end_date ?? leave.end)?.split('T')?.[0]}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700">{leave.status}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                                                        onClick={() => { window.location.href = `/employee/calendar/details/${leave.id}` }}
                                                        aria-label={`Szczegóły urlopu ${leave.id}`}
                                                    >
                                                        Szczegóły
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                                <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Poprzednia</button>
                                <div>Strona {page} / {totalPages}</div>
                                <button className="btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Następna</button>
                            </div>
                        </div>

                        <div className="w-2/3">
                            {events.length === 0 ? (
                                <p>Brak historii zmian urlopów do wyświetlenia w kalendarzu.</p>
                            ) : (
                                <div className="calendar-container">
                                    <FullCalendar
                                        ref={calendarRef}
                                        plugins={[dayGridPlugin]}
                                        initialView="dayGridMonth"
                                        locale={plLocale}
                                        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
                                        events={events}
                                        height="auto"
                                        eventContent={(eventInfo) => ({ html: eventInfo.event.title })}
                                        eventClick={(clickInfo) => { window.location.href = `/employee/calendar/show/${clickInfo.event.id}` }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
       </EmployeeLayout>
    );
}
