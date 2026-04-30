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

type TaskSummary = {
    taskId: number;
    operationName: string;
    operationId: number | null;
    stepNumber: number | null;
    actualSeconds: number;
    normSeconds: number;
    normPerformancePercent: number;
    normUsagePercent: number;
    finishedAt: string;
};

type ScanModalAction = 'start_changeover' | 'end_changeover' | 'start_task' | 'finish_task';

const fmt = (value?: string | null) => value || '-';

const fmtDate = (value?: string | null): string => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
};

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
    const [changeoverDoneLocalIds, setChangeoverDoneLocalIds] = useState<Set<string>>(new Set());
    const [completedTaskLocalCounts, setCompletedTaskLocalCounts] = useState<Record<string, number>>({});
    const [nowTs, setNowTs] = useState<number>(Date.now());
    const [events, setEvents] = useState<EventMessage[]>([]);
    const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(null);
    const [taskSummaryHistory, setTaskSummaryHistory] = useState<TaskSummary[]>([]);
    const [scanModalAction, setScanModalAction] = useState<ScanModalAction | null>(null);
    const [scanModalMachineCode, setScanModalMachineCode] = useState<string>('');
    const [scanModalOperationCode, setScanModalOperationCode] = useState<string>('');
    const [scanModalError, setScanModalError] = useState<string>('');
    const normAlarmTriggeredRef = useRef<boolean>(false);
    const changeoverAlarmTriggeredRef = useRef<boolean>(false);

    useEffect(() => {
        const id = window.setInterval(() => setNowTs(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const raw = window.localStorage.getItem(`workbench-summary-history-${plan.id}`);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                setTaskSummaryHistory(parsed.slice(0, 10));
            }
        } catch {
            // ignore invalid local storage payload
        }
    }, [plan.id]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            window.localStorage.setItem(
                `workbench-summary-history-${plan.id}`,
                JSON.stringify(taskSummaryHistory)
            );
        } catch {
            // local storage may be unavailable in private mode
        }
    }, [plan.id, taskSummaryHistory]);

    const selectedTask = useMemo(
        () => tasks.find((task) => String(task.id) === selectedTaskId),
        [tasks, selectedTaskId]
    );

    const requiredMachineBarcode = plan.machine?.barcode ?? '';
    const requiredOperationBarcode = selectedTask?.operation?.barcode ?? '';
    const isMachineBarcodeMatched = !!requiredMachineBarcode && machineBarcode.trim() === requiredMachineBarcode;
    const isOperationBarcodeMatched = !!requiredOperationBarcode && operationBarcode.trim() === requiredOperationBarcode;

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

    const getTaskRequiredCycles = (task?: TaskRow): number => {
        return Math.max(1, Number(task?.order_quantity ?? 1) || 1);
    };

    const getTaskCompletedCycles = (task?: TaskRow): number => {
        if (!task) return 0;

        let backendCycles = 0;
        if (task.notes) {
            try {
                const parsed = JSON.parse(task.notes);
                backendCycles = Math.max(0, Number(parsed?.completed_cycles ?? 0) || 0);
            } catch {
                backendCycles = 0;
            }
        }

        // Backward compatibility: old finished records may not have completed_cycles in notes.
        if (backendCycles === 0 && task.status === 'zakonczono_proces') {
            backendCycles = 1;
        }

        const localCycles = Math.max(0, Number(completedTaskLocalCounts[String(task.id)] ?? 0) || 0);
        return Math.max(backendCycles, localCycles);
    };

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
        // If changeover was locally marked as done, treat as not required
        if (changeoverDoneLocalIds.has(String(selectedTask.id))) return false;
        const lastOperationId = plan.machine?.last_operationmachine_id ?? null;
        return Number(lastOperationId ?? 0) !== Number(selectedTask.operationmachine_id ?? 0);
    }, [selectedTask, plan, changeoverDoneLocalIds]);

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

    const isTaskMarkedDone = (task?: TaskRow) => {
        if (!task) return false;
        return getTaskCompletedCycles(task) >= getTaskRequiredCycles(task);
    };

    const selectableTasks = useMemo(
        () => tasks.filter((task) => !isTaskMarkedDone(task)),
        [tasks, completedTaskLocalCounts]
    );

    const isTaskCompleted = isTaskMarkedDone(selectedTask);
    const hasTaskFinishedMarkers = !!selectedNotes?.task_finished_at || !!selectedTask?.planned_end_at;
    const isTaskStarted = !!taskStartTs || (selectedTask?.status === 'rozpoczeto_proces' && !hasTaskFinishedMarkers);
    const isChangeoverDone = !!selectedNotes?.changeover_ended_at || changeoverDoneLocalIds.has(String(selectedTaskId));
    const isChangeoverInProgress = (
        !!selectedNotes?.changeover_started_at || !!changeoverStartTs
    ) && !isChangeoverDone;
    const canStartChangeover = !!selectedTaskId
        && isChangeoverRequiredForTask
        && !isChangeoverInProgress
        && !isChangeoverDone
        && !isTaskStarted
        && !isTaskCompleted;
    const canEndChangeover = !!selectedTaskId
        && isChangeoverRequiredForTask
        && (!!selectedNotes?.changeover_started_at || !!changeoverStartTs)
        && !isChangeoverDone
        && !isTaskStarted
        && !isTaskCompleted;
    const canStartTask = !!selectedTaskId
        && !isChangeoverInProgress
        && !isTaskStarted
        && !isTaskCompleted
        && (!isChangeoverRequiredForTask || isChangeoverDone);
    const canFinishTask = !!selectedTaskId
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

    useEffect(() => {
        if (!selectedTaskId) {
            if (selectableTasks.length > 0) {
                const firstTask = selectableTasks[0];
                setSelectedTaskId(String(firstTask.id));
                setOperationBarcode(firstTask.operation?.barcode ?? '');
            }
            return;
        }

        const stillSelectable = selectableTasks.some((task) => String(task.id) === selectedTaskId);
        if (!stillSelectable) {
            if (selectableTasks.length > 0) {
                const firstTask = selectableTasks[0];
                setSelectedTaskId(String(firstTask.id));
                setOperationBarcode(firstTask.operation?.barcode ?? '');
            } else {
                setSelectedTaskId('');
                setOperationBarcode('');
            }
        }
    }, [selectedTaskId, selectableTasks]);

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

    // Restore timers from backend notes when task is selected or notes change (e.g. after page reload)
    useEffect(() => {
        if (!selectedTask) {
            setChangeoverStartTs(null);
            setTaskStartTs(null);
            return;
        }

        const notes: Record<string, any> = (() => {
            if (!selectedTask.notes) return {};
            try {
                const p = JSON.parse(selectedTask.notes);
                return (p && typeof p === 'object') ? p : {};
            } catch { return {}; }
        })();

        if (notes.changeover_started_at && !notes.changeover_ended_at) {
            const ts = new Date(notes.changeover_started_at).getTime();
            if (!isNaN(ts)) setChangeoverStartTs(ts);
        } else {
            setChangeoverStartTs(null);
        }

        if (notes.task_started_at && selectedTask.status === 'rozpoczeto_proces') {
            const ts = new Date(notes.task_started_at).getTime();
            if (!isNaN(ts)) setTaskStartTs(ts);
        } else {
            setTaskStartTs(null);
        }
    }, [selectedTaskId, selectedTask?.notes]);

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

    const startChangeover = (machineCodeOverride?: string) => {
        if (!selectedTaskId) return;
        const machineCode = (machineCodeOverride ?? machineBarcode).trim();

        router.post(`/employee/production/${plan.id}/changeover/start`, {
            machine_barcode: machineCode,
            task_plan_id: Number(selectedTaskId),
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setChangeoverStartTs(Date.now());
                setMachineBarcode('');
                changeoverAlarmTriggeredRef.current = false;
                addEvent('Rozpoczęto przezbrojenie maszyny (scan OK).', 'info');
            },
        });
    };

    const endChangeover = (machineCodeOverride?: string) => {
        if (!selectedTaskId) return;
        const machineCode = (machineCodeOverride ?? machineBarcode).trim();

        router.post(`/employee/production/${plan.id}/changeover/end`, {
            machine_barcode: machineCode,
            task_plan_id: Number(selectedTaskId),
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setChangeoverStartTs(null);
                setChangeoverDoneLocalIds((prev) => new Set([...prev, String(selectedTaskId)]));
                addEvent('Zakończono przezbrojenie maszyny.', 'success');
            },
        });
    };

    const startTask = (machineCodeOverride?: string, operationCodeOverride?: string) => {
        if (!selectedTaskId) return;
        const machineCode = (machineCodeOverride ?? machineBarcode).trim();
        const operationCode = (operationCodeOverride ?? operationBarcode).trim();

        router.post(`/employee/production/${plan.id}/task/start`, {
            task_plan_id: Number(selectedTaskId),
            machine_barcode: machineCode,
            operation_barcode: operationCode,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setTaskStartTs(Date.now());
                setOperationBarcode('');
                normAlarmTriggeredRef.current = false;
                addEvent('Rozpoczęto produkcję / zadanie (scan operacji OK).', 'info');
            },
        });
    };

    const finishTask = (machineCodeOverride?: string, operationCodeOverride?: string) => {
        if (!selectedTaskId) return;
        const machineCode = (machineCodeOverride ?? machineBarcode).trim();
        const operationCode = (operationCodeOverride ?? operationBarcode).trim();

        // Capture metrics at moment of click
        const capturedElapsed = taskStartTs ? Math.floor((Date.now() - taskStartTs) / 1000) : taskElapsed;
        const capturedNorm = normTaskSeconds;
        const capturedPerf = capturedNorm > 0 ? Math.round((capturedNorm / Math.max(capturedElapsed, 1)) * 10000) / 100 : 0;
        const capturedUsage = capturedNorm > 0 ? Math.round((capturedElapsed / capturedNorm) * 10000) / 100 : 0;
        const capturedTask = selectedTask;
        const currentTaskId = selectedTaskId;
        const requiredCycles = getTaskRequiredCycles(capturedTask ?? undefined);
        const completedBefore = getTaskCompletedCycles(capturedTask ?? undefined);
        const completedAfter = Math.min(requiredCycles, completedBefore + 1);
        const isFinalCycle = completedAfter >= requiredCycles;

        router.post(`/employee/production/${plan.id}/task/finish`, {
            task_plan_id: Number(selectedTaskId),
            machine_barcode: machineCode,
            operation_barcode: operationCode,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setTaskStartTs(null);
                setCompletedTaskLocalCounts((prev) => ({
                    ...prev,
                    [currentTaskId]: completedAfter,
                }));
                addEvent(`Zakończono zadanie (scan operacji OK): ${completedAfter}/${requiredCycles}.`, 'success');

                if (capturedTask) {
                    const summary: TaskSummary = {
                        taskId: capturedTask.id,
                        operationName: capturedTask.operation?.operation_name ?? '-',
                        operationId: capturedTask.operationmachine_id ?? null,
                        stepNumber: capturedTask.step?.step_number ?? null,
                        actualSeconds: capturedElapsed,
                        normSeconds: capturedNorm,
                        normPerformancePercent: capturedPerf,
                        normUsagePercent: capturedUsage,
                        finishedAt: new Date().toLocaleString('pl-PL'),
                    };

                    setTaskSummary(summary);
                    setTaskSummaryHistory((prev) => [summary, ...prev].slice(0, 10));

                    const currentIndex = tasks.findIndex((task) => String(task.id) === currentTaskId);
                    const nextTask = tasks
                        .slice(Math.max(currentIndex, 0))
                        .find((task) => {
                            if (String(task.id) === currentTaskId) {
                                return !isFinalCycle;
                            }

                            return !isTaskMarkedDone(task);
                        });

                    if (nextTask) {
                        const sameOperation = Number(nextTask.operationmachine_id ?? 0) === Number(summary.operationId ?? 0);
                        setSelectedTaskId(String(nextTask.id));
                        setOperationBarcode(nextTask.operation?.barcode ?? '');
                        setTaskStartTs(null);

                        if (!sameOperation) {
                            setMachineBarcode('');
                            setChangeoverDoneLocalIds((prev) => {
                                const copy = new Set(prev);
                                copy.delete(String(nextTask.id));
                                return copy;
                            });
                            addEvent(`Przekierowano do kolejnego zadania: krok ${nextTask.step?.step_number ?? '-'} (${nextTask.operation?.operation_name ?? '-'})`, 'info');
                        } else {
                            setChangeoverDoneLocalIds((prev) => new Set([...prev, String(nextTask.id)]));
                            addEvent('Kolejne zadanie ma tę samą operację - przezbrojenie nie jest wymagane.', 'success');
                        }
                    } else {
                        setSelectedTaskId('');
                        setOperationBarcode('');
                        setMachineBarcode('');
                        addEvent('Brak kolejnych zadań do wykonania. Wszystkie zadania zakończone.', 'success');
                    }
                }
            },
        });
    };

    const handleMachineInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        if (canStartChangeover && isMachineBarcodeMatched) {
            startChangeover();
            return;
        }
        if (canEndChangeover && isMachineBarcodeMatched) {
            endChangeover();
        }
    };

    const handleOperationInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        if (canStartTask && isMachineBarcodeMatched && isOperationBarcodeMatched) {
            startTask();
            return;
        }
        if (canFinishTask && isMachineBarcodeMatched && isOperationBarcodeMatched) {
            finishTask();
        }
    };

    const openScanModal = (action: ScanModalAction) => {
        setScanModalAction(action);
        setScanModalMachineCode('');
        setScanModalOperationCode('');
        setScanModalError('');
    };

    const closeScanModal = () => {
        setScanModalAction(null);
        setScanModalMachineCode('');
        setScanModalOperationCode('');
        setScanModalError('');
    };

    const submitScanModal = () => {
        if (!scanModalAction) return;

        const machineCode = scanModalMachineCode.trim();
        const operationCode = scanModalOperationCode.trim();

        if (!machineCode) {
            setScanModalError('Zeskanuj barcode maszyny.');
            return;
        }

        if (machineCode !== requiredMachineBarcode) {
            setScanModalError('Barcode maszyny nie pasuje do zadania.');
            return;
        }

        if ((scanModalAction === 'start_task' || scanModalAction === 'finish_task')) {
            if (!operationCode) {
                setScanModalError('Zeskanuj barcode operacji.');
                return;
            }

            if (operationCode !== requiredOperationBarcode) {
                setScanModalError('Barcode operacji nie pasuje do wybranego zadania.');
                return;
            }
        }

        setMachineBarcode(machineCode);
        if (operationCode) {
            setOperationBarcode(operationCode);
        }

        closeScanModal();

        if (scanModalAction === 'start_changeover') {
            startChangeover(machineCode);
            return;
        }
        if (scanModalAction === 'end_changeover') {
            endChangeover(machineCode);
            return;
        }
        if (scanModalAction === 'start_task') {
            startTask(machineCode, operationCode);
            return;
        }

        finishTask(machineCode, operationCode);
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
                                <Barcode value={String(plan.order?.barcode ?? '0')} format="CODE128" width={1.6} height={46} displayValue={false} margin={4} />
                                <span className="text-[10px] text-gray-600 mt-1">{plan.order?.barcode ?? '-'}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Maszyna</p>
                            <div className="inline-flex flex-col items-center border rounded px-2 py-1">
                                <Barcode value={String(plan.machine?.barcode ?? '0')} format="CODE128" width={1.6} height={46} displayValue={false} margin={4} />
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
                                <div className="mt-1 inline-flex flex-col items-center rounded border border-blue-200 bg-white px-2 py-1">
                                    <Barcode value={String(requiredMachineBarcode || '0')} format="CODE128" width={1.8} height={56} displayValue={false} margin={6} />
                                </div>
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
                                <div className="mt-1 inline-flex flex-col items-center rounded border border-blue-200 bg-white px-2 py-1">
                                    <Barcode value={String(requiredOperationBarcode || '0')} format="CODE128" width={1.8} height={56} displayValue={false} margin={6} />
                                </div>
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
                                {selectableTasks.map((task) => (
                                    <option key={task.id} value={task.id}>
                                        Krok {task.step?.step_number ?? '-'} - {task.operation?.operation_name ?? '-'}
                                        {isTaskMarkedDone(task)
                                            ? ` (wykonane ${getTaskCompletedCycles(task)}/${getTaskRequiredCycles(task)})`
                                            : ` (${getTaskCompletedCycles(task)}/${getTaskRequiredCycles(task)})`}
                                        {task.id === suggestedTaskId ? ' (sugerowane)' : ''}
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
                                    onClick={() => openScanModal('start_changeover')}
                                    disabled={!canStartChangeover}
                                    className={`px-3 py-2 text-sm rounded border ${canStartChangeover ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                                >
                                    Start przezbrojenia (scan)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openScanModal('end_changeover')}
                                    disabled={!canEndChangeover}
                                    className={`px-3 py-2 text-sm rounded border ${canEndChangeover ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                                    title={!isMachineBarcodeMatched ? 'Aby zakończyć przezbrojenie, zeskanuj poprawny barcode maszyny.' : undefined}
                                >
                                    Koniec przezbrojenia (scan)
                                </button>
                            </>
                        )}
                        <button
                            type="button"
                            onClick={() => openScanModal('start_task')}
                            disabled={!canStartTask}
                            className={`px-3 py-2 text-sm rounded text-white ${canStartTask ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-300 cursor-not-allowed'}`}
                        >
                            Start zadania
                        </button>
                        <button
                            type="button"
                            onClick={() => openScanModal('finish_task')}
                            disabled={!canFinishTask}
                            className={`px-3 py-2 text-sm rounded text-white ${canFinishTask ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-300 cursor-not-allowed'}`}
                            title={!isOperationBarcodeMatched ? 'Aby zakończyć zadanie, zeskanuj poprawny barcode operacji.' : undefined}
                        >
                            Zakończ zadanie (scan operacji)
                        </button>
                    </div>

                    {selectedTask && !isMachineBarcodeMatched && (selectedTask ? isChangeoverRequiredForTask : changeoverRequired) && !!selectedNotes?.changeover_started_at && !isChangeoverDone && (
                        <p className="text-xs text-red-600">Aby zakończyć przezbrojenie, zeskanuj dokładnie barcode przypisanej maszyny.</p>
                    )}
                    {selectedTask && !isMachineBarcodeMatched && (!isTaskCompleted) && (
                        <p className="text-xs text-red-600">Aby rozpocząć lub zakończyć zadanie, zeskanuj dokładnie barcode przypisanej maszyny.</p>
                    )}
                    {selectedTask && !isOperationBarcodeMatched && isTaskStarted && !isTaskCompleted && (
                        <p className="text-xs text-red-600">Aby zakończyć zadanie, zeskanuj dokładnie barcode bieżącej operacji.</p>
                    )}

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
                            <p>Start: {fmtDate(selectedTask.planned_start_at)} | Koniec: {fmtDate(selectedTask.planned_end_at)}</p>
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

                {taskSummary && (
                    <div className="bg-emerald-50 rounded shadow p-4 border border-emerald-300">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold text-emerald-800">✓ Podsumowanie zakończonego zadania</h3>
                            <button
                                type="button"
                                onClick={() => setTaskSummary(null)}
                                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-300 bg-white"
                            >
                                Zamknij
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="bg-white rounded border p-3">
                                <p className="text-xs text-gray-500 mb-1">Operacja</p>
                                <p className="font-semibold text-gray-800">Krok {taskSummary.stepNumber ?? '-'} — {taskSummary.operationName}</p>
                            </div>
                            <div className="bg-white rounded border p-3">
                                <p className="text-xs text-gray-500 mb-1">Czas rzeczywisty</p>
                                <p className="font-semibold text-gray-800 font-mono">{toHms(taskSummary.actualSeconds)}</p>
                            </div>
                            <div className="bg-white rounded border p-3">
                                <p className="text-xs text-gray-500 mb-1">Norma czasu</p>
                                <p className="font-semibold text-gray-800 font-mono">{toHms(taskSummary.normSeconds)}</p>
                            </div>
                            <div className={`rounded border p-3 ${taskSummary.normPerformancePercent >= 100 ? 'bg-emerald-100 border-emerald-300' : taskSummary.normPerformancePercent >= 75 ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-300'}`}>
                                <p className="text-xs text-gray-500 mb-1">Wykonanie normy</p>
                                <p className={`text-xl font-bold ${taskSummary.normPerformancePercent >= 100 ? 'text-emerald-700' : taskSummary.normPerformancePercent >= 75 ? 'text-amber-700' : 'text-red-700'}`}>
                                    {taskSummary.normPerformancePercent.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div className="bg-white rounded border p-3">
                                <p className="text-xs text-gray-500 mb-1">Zużycie normy</p>
                                <p className={`font-semibold ${taskSummary.normUsagePercent > 100 ? 'text-red-700' : 'text-emerald-700'}`}>
                                    {taskSummary.normUsagePercent.toFixed(1)}%
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{taskSummary.normUsagePercent <= 100 ? 'Ukończono w normie' : `Przekroczono o ${(taskSummary.normUsagePercent - 100).toFixed(1)}%`}</p>
                            </div>
                            <div className="bg-white rounded border p-3">
                                <p className="text-xs text-gray-500 mb-1">Różnica czasu</p>
                                <p className={`font-semibold font-mono ${taskSummary.actualSeconds <= taskSummary.normSeconds ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {taskSummary.actualSeconds <= taskSummary.normSeconds
                                        ? `- ${toHms(taskSummary.normSeconds - taskSummary.actualSeconds)}`
                                        : `+ ${toHms(taskSummary.actualSeconds - taskSummary.normSeconds)}`}
                                </p>
                            </div>
                            <div className="bg-white rounded border p-3">
                                <p className="text-xs text-gray-500 mb-1">Zakończono o</p>
                                <p className="font-semibold text-gray-800">{taskSummary.finishedAt}</p>
                            </div>
                        </div>
                    </div>
                )}

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
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Postęp</th>
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
                                                <Barcode value={String(task.operation?.barcode ?? '0')} format="CODE128" width={1.5} height={44} displayValue={false} margin={4} />
                                                <span className="text-[10px] text-gray-600 mt-1">{task.operation?.barcode ?? '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            {isTaskMarkedDone(task)
                                                ? 'zakonczono_proces'
                                                : task.status}
                                        </td>
                                        <td className={`px-3 py-2 font-mono ${isTaskMarkedDone(task) ? 'text-emerald-700 font-semibold' : 'text-gray-700'}`}>
                                            {getTaskCompletedCycles(task)}/{getTaskRequiredCycles(task)}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">{fmtDate(task.planned_start_at)}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{fmtDate(task.planned_end_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {taskSummaryHistory.length > 0 && (
                    <div className="bg-white rounded shadow p-4 border">
                        <h3 className="text-base font-semibold mb-2">Historia podejść (normy)</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Krok</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Operacja</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rzeczywisty</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Norma</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Wykonanie</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Zakończono</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {taskSummaryHistory.map((summary) => (
                                        <tr key={`${summary.taskId}-${summary.finishedAt}`}>
                                            <td className="px-3 py-2">{summary.stepNumber ?? '-'}</td>
                                            <td className="px-3 py-2">{summary.operationName}</td>
                                            <td className="px-3 py-2 font-mono">{toHms(summary.actualSeconds)}</td>
                                            <td className="px-3 py-2 font-mono">{toHms(summary.normSeconds)}</td>
                                            <td className="px-3 py-2">{summary.normPerformancePercent.toFixed(1)}%</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{summary.finishedAt}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {scanModalAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-xl rounded-lg bg-white p-4 shadow-xl border">
                        <h3 className="text-base font-semibold mb-2">
                            {scanModalAction === 'start_changeover' && 'Skanowanie do startu przezbrojenia'}
                            {scanModalAction === 'end_changeover' && 'Skanowanie do zakończenia przezbrojenia'}
                            {scanModalAction === 'start_task' && 'Skanowanie do startu zadania'}
                            {scanModalAction === 'finish_task' && 'Skanowanie do zakończenia zadania'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div className="rounded border p-3 bg-blue-50">
                                <p className="text-xs text-blue-700 mb-1">Wymagany barcode maszyny</p>
                                <p className="font-mono text-blue-900 mb-2">{requiredMachineBarcode || '-'}</p>
                                <Barcode value={String(requiredMachineBarcode || '0')} format="CODE128" width={1.8} height={56} displayValue={false} margin={6} />
                            </div>

                            {(scanModalAction === 'start_task' || scanModalAction === 'finish_task') && (
                                <div className="rounded border p-3 bg-blue-50">
                                    <p className="text-xs text-blue-700 mb-1">Wymagany barcode operacji</p>
                                    <p className="font-mono text-blue-900 mb-2">{requiredOperationBarcode || '-'}</p>
                                    <Barcode value={String(requiredOperationBarcode || '0')} format="CODE128" width={1.8} height={56} displayValue={false} margin={6} />
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Skanowany barcode maszyny</label>
                                <input
                                    type="text"
                                    value={scanModalMachineCode}
                                    onChange={(e) => setScanModalMachineCode(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') submitScanModal();
                                    }}
                                    className="w-full border rounded px-2 py-1 text-sm"
                                    placeholder="zeskanuj kod maszyny"
                                    autoFocus
                                />
                            </div>

                            {(scanModalAction === 'start_task' || scanModalAction === 'finish_task') && (
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Skanowany barcode operacji</label>
                                    <input
                                        type="text"
                                        value={scanModalOperationCode}
                                        onChange={(e) => setScanModalOperationCode(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') submitScanModal();
                                        }}
                                        className="w-full border rounded px-2 py-1 text-sm"
                                        placeholder="zeskanuj kod operacji"
                                    />
                                </div>
                            )}

                            {scanModalError && (
                                <p className="text-xs text-red-600">{scanModalError}</p>
                            )}
                        </div>

                        <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeScanModal}
                                className="px-3 py-2 text-sm rounded border hover:bg-gray-50"
                            >
                                Anuluj
                            </button>
                            <button
                                type="button"
                                onClick={submitScanModal}
                                className="px-3 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                                Potwierdź skan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </EmployeeLayout>
    );
}
