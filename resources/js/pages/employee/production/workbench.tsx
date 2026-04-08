import React, { useMemo, useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import Barcode from 'react-barcode';

type WorkPlan = {
    id: number;
    barcode?: string | null;
    status: string;
    planned_start_at?: string | null;
    order_quantity?: number | null;
    items_finished_good_id?: number | null;
    order?: { barcode?: string | null; customer_name?: string | null } | null;
    item?: { name?: string | null } | null;
    machine?: { id: number; name?: string | null; barcode?: string | null; last_operationmachine_id?: number | null } | null;
    operation?: { id: number; operation_name?: string | null; barcode?: string | null } | null;
};

type TaskRow = {
    id: number;
    status: string;
    notes?: string | null;
    planned_start_at?: string | null;
    planned_end_at?: string | null;
    order_quantity?: number | null;
    operationmachine_id?: number | null;
    operation?: { id: number; operation_name?: string | null; barcode?: string | null; changeover_time?: number | null } | null;
    step?: { step_number?: number | null; production_time_seconds?: number | null } | null;
};

type Props = {
    plan: WorkPlan;
    tasks: TaskRow[];
    changeoverRequired: boolean;
    suggestedTaskId?: number | null;
    activityEvents?: {
        id: number;
        task_plan_id: number;
        event_type?: string | null;
        message: string;
        occurred_at?: string | null;
        norm_required_seconds?: number | null;
        actual_task_seconds?: number | null;
        norm_usage_percent?: number | null;
        norm_performance_percent?: number | null;
    }[];
};

type EventMessage = {
    id: number;
    text: string;
    createdAt: string;
    level: 'info' | 'success' | 'warning';
};

const fmt = (value?: string | null) => value || '-';

const toHms = (seconds: number) => {
    const safe = Math.max(0, Math.floor(seconds));
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    const s = safe % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function ProductionWorkbench({ plan, tasks, changeoverRequired, suggestedTaskId, activityEvents = [] }: Props) {
    const [machineBarcode, setMachineBarcode] = useState<string>('');
    const [operationBarcode, setOperationBarcode] = useState<string>('');
    const [selectedTaskId, setSelectedTaskId] = useState<string>(suggestedTaskId ? String(suggestedTaskId) : '');
    const [changeoverStartTs, setChangeoverStartTs] = useState<number | null>(null);
    const [taskStartTs, setTaskStartTs] = useState<number | null>(null);
    const [nowTs, setNowTs] = useState<number>(Date.now());
    const [events, setEvents] = useState<EventMessage[]>([]);
    const normAlarmTriggeredRef = useRef<boolean>(false);
    const changeoverAlarmTriggeredRef = useRef<boolean>(false);

    useEffect(() => {
        const id = window.setInterval(() => setNowTs(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, []);

    const selectedTask = useMemo(
        () => tasks.find((task) => String(task.id) === selectedTaskId),
        [tasks, selectedTaskId]
    );

    const requiredMachineBarcode = plan.machine?.barcode ?? '';
    const requiredOperationBarcode = selectedTask?.operation?.barcode ?? '';

    const selectedIndex = useMemo(
        () => tasks.findIndex((task) => String(task.id) === selectedTaskId),
        [tasks, selectedTaskId]
    );

    const selectedNotes = useMemo(() => {
        if (!selectedTask?.notes) return {} as Record<string, any>;
        try {
            const parsed = JSON.parse(selectedTask.notes);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {} as Record<string, any>;
        }
    }, [selectedTask]);

    const normPerformancePercent = useMemo(() => {
        const value = Number(selectedNotes?.norm_performance_percent);
        return Number.isFinite(value) ? value : null;
    }, [selectedNotes]);

    const normUsagePercent = useMemo(() => {
        const value = Number(selectedNotes?.norm_usage_percent);
        return Number.isFinite(value) ? value : null;
    }, [selectedNotes]);

    const isChangeoverRequiredForTask = useMemo(() => {
        if (!selectedTask) return false;
        const lastOperationId = plan.machine?.last_operationmachine_id ?? null;
        return Number(lastOperationId ?? 0) !== Number(selectedTask.operationmachine_id ?? 0);
    }, [selectedTask, plan]);

    const requiredChangeoverSeconds = useMemo(() => {
        if (!selectedTask || !isChangeoverRequiredForTask) return 0;
        return Math.round((Number(selectedTask.operation?.changeover_time ?? 0) || 0) * 60);
    }, [selectedTask, isChangeoverRequiredForTask]);

    const normTaskSeconds = useMemo(() => {
        if (!selectedTask) return 0;
        return (Number(selectedTask.step?.production_time_seconds ?? 0) || 0) * (Number(selectedTask.order_quantity ?? plan.order_quantity ?? 1) || 1);
    }, [selectedTask, plan.order_quantity]);

    const changeoverElapsed = changeoverStartTs ? Math.floor((nowTs - changeoverStartTs) / 1000) : 0;
    const taskElapsed = taskStartTs ? Math.floor((nowTs - taskStartTs) / 1000) : 0;
    const taskRemaining = Math.max(normTaskSeconds - taskElapsed, 0);
    const changeoverRemaining = Math.max(requiredChangeoverSeconds - changeoverElapsed, 0);

    const isTaskCompleted = selectedTask?.status === 'zakonczono_proces';
    const isTaskStarted = selectedTask?.status === 'rozpoczeto_proces' || !!selectedNotes?.task_started_at || !!taskStartTs;
    const isChangeoverDone = !!selectedNotes?.changeover_ended_at;
    const canStartChangeover = !!selectedTaskId
        && !!machineBarcode
        && isChangeoverRequiredForTask
        && !isChangeoverDone
        && !isTaskStarted
        && !isTaskCompleted;
    const canEndChangeover = !!selectedTaskId
        && !!machineBarcode
        && isChangeoverRequiredForTask
        && !!selectedNotes?.changeover_started_at
        && !isChangeoverDone
        && !isTaskStarted
        && !isTaskCompleted;
    const canStartTask = !!selectedTaskId
        && !!operationBarcode
        && !isTaskStarted
        && !isTaskCompleted
        && (!isChangeoverRequiredForTask || isChangeoverDone);
    const canFinishTask = !!selectedTaskId
        && !!operationBarcode
        && isTaskStarted
        && !isTaskCompleted;

    const nextScanHint = useMemo(() => {
        if (!selectedTaskId) return 'Wybierz zadanie ze schematu.';
        if ((selectedTask ? isChangeoverRequiredForTask : changeoverRequired) && !isChangeoverDone) {
            if (!selectedNotes?.changeover_started_at) return 'Zeskanuj barcode maszyny i kliknij Start przezbrojenia.';
            return 'Zeskanuj barcode maszyny i kliknij Koniec przezbrojenia.';
        }
        if (!isTaskStarted) return 'Zeskanuj barcode operacji i kliknij Start zadania.';
        if (!isTaskCompleted) return 'Po wykonaniu operacji zeskanuj barcode operacji i kliknij Zakończ zadanie.';
        return 'Zadanie zakończone. Wybierz następną operację.';
    }, [selectedTaskId, selectedTask, isChangeoverRequiredForTask, changeoverRequired, isChangeoverDone, selectedNotes, isTaskStarted, isTaskCompleted]);

    const dbEventsForView = useMemo(() => {
        const scoped = selectedTaskId
            ? activityEvents.filter((event) => String(event.task_plan_id) === String(selectedTaskId))
            : activityEvents;

        return scoped
            .map((event) => ({
                id: event.id,
                text: event.message,
                createdAt: event.occurred_at
                    ? new Date(event.occurred_at).toLocaleTimeString('pl-PL')
                    : new Date().toLocaleTimeString('pl-PL'),
                level: event.event_type === 'success' || event.event_type === 'warning'
                    ? event.event_type
                    : 'info',
            }))
            .slice(0, 12) as EventMessage[];
    }, [activityEvents, selectedTaskId]);

    useEffect(() => {
        setEvents(dbEventsForView);
    }, [dbEventsForView]);

    const playAlertTone = () => {
        try {
            const audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);

            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch {
            // brak wsparcia audio w przeglądarce
        }
    };

    const addEvent = (text: string, level: 'info' | 'success' | 'warning' = 'info') => {
        const createdAt = new Date().toLocaleTimeString('pl-PL');
        setEvents((prev) => [{ id: Date.now() + Math.floor(Math.random() * 1000), text, createdAt, level }, ...prev].slice(0, 12));
    };

    useEffect(() => {
        if (!selectedTask) return;

        addEvent(`Wybrano zadanie: Krok ${selectedTask.step?.step_number ?? '-'} - ${selectedTask.operation?.operation_name ?? '-'}`, 'info');
        if (isChangeoverRequiredForTask) {
            addEvent('Wymagane przezbrojenie maszyny przed startem operacji.', 'warning');
        } else {
            addEvent('Przezbrojenie nie jest wymagane (ta sama operacja na maszynie).', 'success');
        }

        normAlarmTriggeredRef.current = false;
        changeoverAlarmTriggeredRef.current = false;
    }, [selectedTaskId]);

    useEffect(() => {
        if (taskStartTs && taskRemaining === 0 && !normAlarmTriggeredRef.current) {
            normAlarmTriggeredRef.current = true;
            playAlertTone();
            addEvent('Osiągnięto normę czasu operacji.', 'warning');
        }
    }, [taskStartTs, taskRemaining]);

    useEffect(() => {
        if (changeoverStartTs && changeoverRemaining === 0 && !changeoverAlarmTriggeredRef.current && requiredChangeoverSeconds > 0) {
            changeoverAlarmTriggeredRef.current = true;
            playAlertTone();
            addEvent('Osiągnięto wymagany czas przezbrojenia.', 'warning');
        }
    }, [changeoverStartTs, changeoverRemaining, requiredChangeoverSeconds]);

    const startChangeover = () => {
        if (!selectedTaskId) return;

        router.post(`/employee/production/${plan.id}/changeover/start`, {
            machine_barcode: machineBarcode,
            task_plan_id: Number(selectedTaskId),
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setChangeoverStartTs(Date.now());
                changeoverAlarmTriggeredRef.current = false;
                addEvent('Rozpoczęto przezbrojenie maszyny (scan OK).', 'info');
            },
        });
    };

    const endChangeover = () => {
        if (!selectedTaskId) return;

        router.post(`/employee/production/${plan.id}/changeover/end`, {
            machine_barcode: machineBarcode,
            task_plan_id: Number(selectedTaskId),
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setChangeoverStartTs(null);
                addEvent('Zakończono przezbrojenie maszyny.', 'success');
            },
        });
    };

    const startTask = () => {
        if (!selectedTaskId) return;

        router.post(`/employee/production/${plan.id}/task/start`, {
            task_plan_id: Number(selectedTaskId),
            operation_barcode: operationBarcode,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setTaskStartTs(Date.now());
                normAlarmTriggeredRef.current = false;
                addEvent('Rozpoczęto produkcję / zadanie (scan operacji OK).', 'info');
            },
        });
    };

    const finishTask = () => {
        if (!selectedTaskId) return;

        router.post(`/employee/production/${plan.id}/task/finish`, {
            task_plan_id: Number(selectedTaskId),
            operation_barcode: operationBarcode,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setTaskStartTs(null);
                addEvent('Zakończono zadanie (scan operacji OK) i zapisano czas.', 'success');
            },
        });
    };

    const handleMachineInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        if (canStartChangeover) {
            startChangeover();
            return;
        }
        if (canEndChangeover) {
            endChangeover();
        }
    };

    const handleOperationInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        if (canStartTask) {
            startTask();
            return;
        }
        if (canFinishTask) {
            finishTask();
        }
    };

    const breadcrumbs = [
        { label: 'Home', href: '/employee/dashboard' },
        { label: 'Produkcja', href: '/employee/production/my' },
        { label: 'Pulpit pracy', href: '#' },
    ];

    return (
        <EmployeeLayout breadcrumbs={breadcrumbs} title="Pulpit pracy produkcji">
            <div className="space-y-4">
                <div className="bg-white rounded shadow p-4 border">
                    <h2 className="text-lg font-semibold mb-3">Pulpit pracownika</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Zamówienie</p>
                            <div className="inline-flex flex-col items-center border rounded px-2 py-1">
                                <Barcode value={String(plan.order?.barcode ?? '-')} format="CODE128" width={1} height={28} displayValue={false} />
                                <span className="text-[10px] text-gray-600 mt-1">{plan.order?.barcode ?? '-'}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Maszyna</p>
                            <div className="inline-flex flex-col items-center border rounded px-2 py-1">
                                <Barcode value={String(plan.machine?.barcode ?? '-')} format="CODE128" width={1} height={28} displayValue={false} />
                                <span className="text-[10px] text-gray-600 mt-1">{plan.machine?.name ?? '-'} / {plan.machine?.barcode ?? '-'}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Produkt</p>
                            <p className="text-sm font-medium">{plan.item?.name ?? '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Przezbrojenie</p>
                            <p className={`text-sm font-semibold ${(selectedTask ? isChangeoverRequiredForTask : changeoverRequired) ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {(selectedTask ? isChangeoverRequiredForTask : changeoverRequired) ? 'Wymagane' : 'Niewymagane (ta sama operacja)'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded shadow p-4 border space-y-3">
                    <h3 className="text-base font-semibold">Skanowanie i sterowanie</h3>

                    <div className="rounded border bg-blue-50 border-blue-200 p-3">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">Wymagane barcode do aktualnego kroku</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-blue-700">Barcode maszyny</p>
                                <p className="font-mono text-blue-900">{requiredMachineBarcode || '-'}</p>
                                <button
                                    type="button"
                                    onClick={() => setMachineBarcode(requiredMachineBarcode)}
                                    className="mt-1 text-xs px-2 py-1 rounded border border-blue-300 bg-white hover:bg-blue-100"
                                    disabled={!requiredMachineBarcode}
                                >
                                    Wstaw kod maszyny
                                </button>
                            </div>
                            <div>
                                <p className="text-xs text-blue-700">Barcode operacji</p>
                                <p className="font-mono text-blue-900">{requiredOperationBarcode || '-'}</p>
                                <button
                                    type="button"
                                    onClick={() => setOperationBarcode(requiredOperationBarcode)}
                                    className="mt-1 text-xs px-2 py-1 rounded border border-blue-300 bg-white hover:bg-blue-100"
                                    disabled={!requiredOperationBarcode}
                                >
                                    Wstaw kod operacji
                                </button>
                            </div>
                            <div>
                                <p className="text-xs text-blue-700">Co teraz skanować?</p>
                                <p className="text-blue-900">{nextScanHint}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Barcode maszyny</label>
                            <input
                                type="text"
                                value={machineBarcode}
                                onChange={(e) => setMachineBarcode(e.target.value)}
                                onKeyDown={handleMachineInputKeyDown}
                                className="w-full border rounded px-2 py-1 text-sm"
                                placeholder="zeskanuj maszynę"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Wybór zadania (schemat)</label>
                            <select
                                value={selectedTaskId}
                                onChange={(e) => {
                                    setSelectedTaskId(e.target.value);
                                    const task = tasks.find((row) => String(row.id) === e.target.value);
                                    setOperationBarcode(task?.operation?.barcode ?? '');
                                }}
                                className="w-full border rounded px-2 py-1 text-sm"
                            >
                                <option value="">Wybierz zadanie</option>
                                {tasks.map((task) => (
                                    <option key={task.id} value={task.id}>
                                        Krok {task.step?.step_number ?? '-'} - {task.operation?.operation_name ?? '-'}{task.id === suggestedTaskId ? ' (sugerowane)' : ''}
                                    </option>
                                ))}
                            </select>
                            {selectedIndex >= 0 && (
                                <p className="mt-1 text-xs text-gray-500">Operacja {selectedIndex + 1} z {tasks.length}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Barcode operacji</label>
                            <input
                                type="text"
                                value={operationBarcode}
                                onChange={(e) => setOperationBarcode(e.target.value)}
                                onKeyDown={handleOperationInputKeyDown}
                                className="w-full border rounded px-2 py-1 text-sm"
                                placeholder="zeskanuj kod operacji"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {(selectedTask ? isChangeoverRequiredForTask : changeoverRequired) && (
                            <>
                                <button
                                    type="button"
                                    onClick={startChangeover}
                                    disabled={!canStartChangeover}
                                    className={`px-3 py-2 text-sm rounded border ${canStartChangeover ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                                >
                                    Start przezbrojenia (scan)
                                </button>
                                <button
                                    type="button"
                                    onClick={endChangeover}
                                    disabled={!canEndChangeover}
                                    className={`px-3 py-2 text-sm rounded border ${canEndChangeover ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                                >
                                    Koniec przezbrojenia (scan)
                                </button>
                            </>
                        )}
                        <button
                            type="button"
                            onClick={startTask}
                            disabled={!canStartTask}
                            className={`px-3 py-2 text-sm rounded text-white ${canStartTask ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-300 cursor-not-allowed'}`}
                        >
                            Start zadania
                        </button>
                        <button
                            type="button"
                            onClick={finishTask}
                            disabled={!canFinishTask}
                            className={`px-3 py-2 text-sm rounded text-white ${canFinishTask ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-300 cursor-not-allowed'}`}
                        >
                            Zakończ zadanie (scan operacji)
                        </button>
                    </div>

                    {selectedTask && (
                        <p className="text-xs text-gray-600">
                            {!isChangeoverRequiredForTask
                                ? 'Przezbrojenie nie jest wymagane — możesz od razu rozpocząć produkcję.'
                                : !isChangeoverDone
                                    ? 'Najpierw wykonaj przezbrojenie (start i koniec), następnie uruchom produkcję.'
                                    : !isTaskStarted
                                        ? 'Przezbrojenie zakończone — możesz rozpocząć produkcję.'
                                        : isTaskCompleted
                                            ? 'Zadanie zakończone — wybierz kolejną operację.'
                                            : 'Produkcja w toku — po zakończeniu zeskanuj barcode operacji i kliknij stop.'}
                        </p>
                    )}

                    {selectedTask && (
                        <div className="text-sm text-gray-700 space-y-1">
                            <p>
                                Norma operacji: {selectedTask.operation?.operation_name ?? '-'} | Norma czasu: {toHms(normTaskSeconds)} | Zegar pracy: <span className="font-semibold">{toHms(taskElapsed)}</span>
                            </p>
                            <p>
                                Czas do normy: <span className={`font-semibold ${taskRemaining === 0 && taskStartTs ? 'text-red-700' : 'text-emerald-700'}`}>{toHms(taskRemaining)}</span>
                            </p>
                            {(selectedTask ? isChangeoverRequiredForTask : changeoverRequired) && (
                                <p>
                                    Przezbrojenie wymagane: {toHms(requiredChangeoverSeconds)} | Zegar przezbrojenia: <span className="font-semibold">{toHms(changeoverElapsed)}</span> | Pozostało: <span className={`font-semibold ${changeoverRemaining === 0 && changeoverStartTs ? 'text-red-700' : 'text-amber-700'}`}>{toHms(changeoverRemaining)}</span>
                                </p>
                            )}
                            {normPerformancePercent !== null && (
                                <p>
                                    Wykonanie normy: <span className={`font-semibold ${normPerformancePercent >= 100 ? 'text-emerald-700' : 'text-amber-700'}`}>{normPerformancePercent.toFixed(2)}%</span>
                                    {normUsagePercent !== null && (
                                        <span className="text-gray-500"> | Zużycie normy: {normUsagePercent.toFixed(2)}%</span>
                                    )}
                                </p>
                            )}
                            <p>Start: {fmt(selectedTask.planned_start_at)} | Koniec: {fmt(selectedTask.planned_end_at)}</p>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded shadow p-4 border">
                    <h3 className="text-base font-semibold mb-2">Komunikaty czynności</h3>
                    {events.length === 0 ? (
                        <p className="text-sm text-gray-600">Brak komunikatów — rozpocznij przezbrojenie lub zadanie.</p>
                    ) : (
                        <ul className="space-y-2 text-sm">
                            {events.map((event) => (
                                <li
                                    key={event.id}
                                    className={`flex items-start justify-between border rounded px-3 py-2 ${
                                        event.level === 'success'
                                            ? 'bg-emerald-50 border-emerald-200'
                                            : event.level === 'warning'
                                                ? 'bg-amber-50 border-amber-200'
                                                : 'bg-gray-50 border-gray-200'
                                    }`}
                                >
                                    <span>{event.text}</span>
                                    <span className="text-xs text-gray-500 ml-3 whitespace-nowrap">{event.createdAt}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="bg-white rounded shadow p-4 border">
                    <h3 className="text-base font-semibold mb-2">Lista zadań ze schematu</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Krok</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Operacja</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Barcode operacji</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Koniec</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tasks.map((task) => (
                                    <tr key={task.id} className={task.id === suggestedTaskId ? 'bg-amber-50' : ''}>
                                        <td className="px-3 py-2">{task.step?.step_number ?? '-'}</td>
                                        <td className="px-3 py-2">{task.operation?.operation_name ?? '-'}</td>
                                        <td className="px-3 py-2">
                                            <div className="inline-flex flex-col items-center border rounded px-2 py-1">
                                                <Barcode value={String(task.operation?.barcode ?? '-')} format="CODE128" width={1} height={24} displayValue={false} />
                                                <span className="text-[10px] text-gray-600 mt-1">{task.operation?.barcode ?? '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">{task.status}</td>
                                        <td className="px-3 py-2">{fmt(task.planned_start_at)}</td>
                                        <td className="px-3 py-2">{fmt(task.planned_end_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}
