import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import ModeratorLayout from '@/layouts/ModeratorLayout';
import { Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday } from 'date-fns';
import { pl } from 'date-fns/locale/pl';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Leave {
    id: number;
    user_id: number;
    start_date: string;
    end_date: string;
    type: string;
    status: 'pending' | 'approved' | 'rejected';
    notes?: string;
    user: User;
}

interface Statistics {
    total_leaves: number;
    pending_leaves: number;
    approved_leaves: number;
    rejected_leaves: number;
    active_leaves: number;
    upcoming_leaves: number;
}

interface PageProps {
    leaves: Leave[];
    statistics: Statistics;
    activeLeaves: Leave[];
    currentDate: string;
}

export default function LeavesCalendarIndex() {
    const { leaves, statistics, activeLeaves } = usePage<PageProps>().props;
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedLeaves, setSelectedLeaves] = useState<Leave[]>([]);
    const [showModal, setShowModal] = useState(false);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const breadcrumbs = [
        { label: 'Panel Moderatora', href: '/moderator/dashboard' },
        { label: 'Kalendarz Urlopów' },
    ];

    // Pobierz urlopy dla konkretnego dnia
    const getLeavesForDay = (date: Date): Leave[] => {
        return leaves.filter(leave => {
            const startDate = new Date(leave.start_date);
            const endDate = new Date(leave.end_date);
            return date >= startDate && date <= endDate;
        });
    };

    // Obsługa kliknięcia w dzień
    const handleDayClick = (date: Date) => {
        const dayLeaves = getLeavesForDay(date);
        if (dayLeaves.length > 0) {
            setSelectedLeaves(dayLeaves);
            setShowModal(true);
        }
    };

    // Aktualizacja statusu urlopu
    const updateLeaveStatus = (leaveId: number, status: string) => {
        router.put(`/moderator/leaves/${leaveId}/status`, {
            status,
        }, {
            onSuccess: () => {
                setShowModal(false);
                // Refresh data
            }
        });
    };

    const getStatusBadge = (status: string) => {
        const config = {
            pending: { label: 'Oczekujący', className: 'bg-yellow-100 text-yellow-800' },
            approved: { label: 'Zatwierdzony', className: 'bg-green-100 text-green-800' },
            rejected: { label: 'Odrzucony', className: 'bg-red-100 text-red-800' },
        };

        const { label, className } = config[status as keyof typeof config] || config.pending;
        return <Badge className={className}>{label}</Badge>;
    };

    const getTypeLabel = (type: string) => {
        const types = {
            vacation: 'Urlop wypoczynkowy',
            sick: 'Zwolnienie lekarskie',
            maternity: 'Urlop macierzyński',
            paternity: 'Urlop ojcowski',
            other: 'Inne'
        };
        return types[type as keyof typeof types] || type;
    };

    return (
        <ModeratorLayout title="Kalendarz Urlopów" breadcrumbs={breadcrumbs}>
            <div className="space-y-6 p-6">
                {/* Statystyki */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Wszystkie urlopy</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_leaves}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Oczekujące</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.pending_leaves}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Zatwierdzone</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.approved_leaves}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Aktywne</CardTitle>
                            <AlertCircle className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.active_leaves}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Kalendarz */}
                    <Card className="xl:col-span-3">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    {format(currentDate, 'LLLL yyyy', { locale: pl })}
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                                    >
                                        ←
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentDate(new Date())}
                                    >
                                        Dziś
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                                    >
                                        →
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-7 gap-1 mb-4">
                                {['PN', 'WT', 'ŚR', 'CZ', 'PT', 'SB', 'ND'].map(day => (
                                    <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map(date => {
                                    const dayLeaves = getLeavesForDay(date);
                                    const hasLeaves = dayLeaves.length > 0;

                                    return (
                                        <div
                                            key={date.toISOString()}
                                            className={`
                                                p-2 min-h-[80px] border rounded cursor-pointer transition-colors
                                                ${isToday(date) ? 'bg-blue-50 border-blue-200' : ''}
                                                ${!isSameMonth(date, currentDate) ? 'text-gray-400 bg-gray-50' : ''}
                                                ${hasLeaves ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' : 'hover:bg-gray-50'}
                                            `}
                                            onClick={() => handleDayClick(date)}
                                        >
                                            <div className="font-medium text-sm mb-1">
                                                {format(date, 'd')}
                                            </div>
                                            {dayLeaves.slice(0, 2).map(leave => (
                                                <div
                                                    key={leave.id}
                                                    className={`text-xs p-1 mb-1 rounded truncate ${
                                                        leave.status === 'approved'
                                                            ? 'bg-green-100 text-green-800'
                                                            : leave.status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {leave.user.name}
                                                </div>
                                            ))}
                                            {dayLeaves.length > 2 && (
                                                <div className="text-xs text-gray-500">
                                                    +{dayLeaves.length - 2} więcej
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Aktywne urlopy */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Aktywne urlopy</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {activeLeaves.length === 0 ? (
                                    <p className="text-gray-500 text-sm">Brak aktywnych urlopów</p>
                                ) : (
                                    activeLeaves.map(leave => (
                                        <div key={leave.id} className="p-3 border rounded-lg">
                                            <div className="font-medium text-sm">{leave.user.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {format(new Date(leave.start_date), 'dd.MM')} - {format(new Date(leave.end_date), 'dd.MM')}
                                            </div>
                                            <div className="mt-2">
                                                {getStatusBadge(leave.status)}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Modal szczegółów */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-4">Urlopy w tym dniu</h3>
                            <div className="space-y-4">
                                {selectedLeaves.map(leave => (
                                    <div key={leave.id} className="border p-4 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-medium">{leave.user.name}</div>
                                                <div className="text-sm text-gray-500">{leave.user.email}</div>
                                            </div>
                                            {getStatusBadge(leave.status)}
                                        </div>

                                        <div className="text-sm space-y-1">
                                            <div><strong>Typ:</strong> {getTypeLabel(leave.type)}</div>
                                            <div><strong>Okres:</strong> {format(new Date(leave.start_date), 'dd.MM.yyyy')} - {format(new Date(leave.end_date), 'dd.MM.yyyy')}</div>
                                            {leave.notes && <div><strong>Uwagi:</strong> {leave.notes}</div>}
                                        </div>

                                        {leave.status === 'pending' && (
                                            <div className="flex gap-2 mt-3">
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => updateLeaveStatus(leave.id, 'approved')}
                                                >
                                                    Zatwierdź
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => updateLeaveStatus(leave.id, 'rejected')}
                                                >
                                                    Odrzuć
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button variant="outline" onClick={() => setShowModal(false)}>
                                    Zamknij
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ModeratorLayout>
    );
}
