import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import echo from '@/lib/echo';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

type Option = { id: number; name: string };

type Filters = {
  search: string;
  date_from: string;
  date_to: string;
  machine_id: number | null;
  per_page: number;
};

type Row = {
  id: number;
  occurred_at: string;
  employee: string;
  department: string;
  machine: string;
  operation: string;
  norm_required_seconds: number;
  actual_task_seconds: number;
  norm_usage_percent: number | null;
  norm_performance_percent: number | null;
};

type MachineHistoryRow = {
  id: number;
  occurred_at: string;
  operation: string;
  norm_required_seconds: number;
  actual_task_seconds: number;
  norm_performance_percent: number | null;
  norm_usage_percent: number | null;
};

type MachineDetail = {
  machine_id: number;
  label: string;
  avg_performance: number;
  avg_usage: number;
  items_count: number;
  last_occurred_at: string | null;
  history: MachineHistoryRow[];
};

type TrendRow = {
  label: string;
  avg_performance: number;
  avg_usage?: number;
  items_count: number;
};

type RankingRow = {
  label: string;
  avg_performance: number;
  avg_usage: number;
  items_count: number;
};

type DepartmentHistoryRow = {
  id: number;
  occurred_at: string;
  employee: string;
  machine: string;
  operation: string;
  norm_performance_percent: number | null;
  norm_usage_percent: number | null;
};

function formatPercent(value: number | null | undefined) {
  return `${Number(value ?? 0).toFixed(2)}%`;
}

function formatSeconds(value: number | null | undefined) {
  return `${Math.round(Number(value ?? 0))} s`;
}

export default function EmployeePerformancePage() {
  const page = usePage().props as any;
  const summary = page.summary ?? {};
  const charts = page.charts ?? {};
  const records = page.records ?? { data: [], current_page: 1, last_page: 1, total: 0 };
  const initialFilters = page.filters ?? {};
  const machines = (page.filterOptions?.machines ?? []) as Option[];
  const viewer = page.viewer ?? { user_id: null, department_id: null };
  const employeeMachineDetails = (page.employeeMachineDetails ?? []) as MachineDetail[];

  const [filters, setFilters] = useState<Filters>({
    search: initialFilters.search ?? '',
    date_from: initialFilters.date_from ?? '',
    date_to: initialFilters.date_to ?? '',
    machine_id: initialFilters.machine_id ?? null,
    per_page: initialFilters.per_page ?? 15,
  });
  const isFirstFilterRender = useRef(true);

  useEffect(() => {
    const userChannelName = `performance.user.${viewer.user_id}`;
    const deptChannelName = viewer.department_id ? `performance.department.${viewer.department_id}` : null;

    const userChannel = echo.private(userChannelName);
    userChannel.listen('.PerformanceUpdated', () => {
      router.reload({ only: ['summary', 'charts', 'records', 'employeeMachineDetails'] });
    });

    let deptChannel: any = null;
    if (deptChannelName) {
      deptChannel = echo.private(deptChannelName);
      deptChannel.listen('.PerformanceUpdated', () => {
        router.reload({ only: ['summary', 'charts', 'records', 'employeeMachineDetails'] });
      });
    }

    return () => {
      userChannel.stopListening('.PerformanceUpdated');
      echo.leaveChannel(`private-${userChannelName}`);
      if (deptChannelName) {
        deptChannel?.stopListening('.PerformanceUpdated');
        echo.leaveChannel(`private-${deptChannelName}`);
      }
    };
  }, [viewer.department_id, viewer.user_id]);

  useEffect(() => {
    const focus = new URLSearchParams(window.location.search).get('focus');
    if (focus !== 'machines') {
      return;
    }

    const element = document.getElementById('machine-performance-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.get('/employee/performance', filters as any, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [filters]);

  const breadcrumbs = [{ label: 'Moja wydajnosc', href: '/employee/performance' }];

  const selfTrendChart = useMemo(() => {
    const rows = charts.self_trend ?? [];
    return {
      labels: rows.map((row: TrendRow) => row.label),
      datasets: [
        {
          label: 'Moja wydajnosc %',
          data: rows.map((row: TrendRow) => row.avg_performance),
          borderColor: 'rgba(30, 64, 175, 1)',
          backgroundColor: 'rgba(30, 64, 175, 0.18)',
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, [charts.self_trend]);

  const departmentRankingChart = useMemo(() => {
    const rows = charts.department_employee_ranking ?? [];
    return {
      labels: rows.map((row: TrendRow) => row.label),
      datasets: [
        {
          label: 'Pracownicy wydzialu - srednia %',
          data: rows.map((row: TrendRow) => row.avg_performance),
          backgroundColor: 'rgba(22, 163, 74, 0.75)',
        },
      ],
    };
  }, [charts.department_employee_ranking]);

  const machineChart = useMemo(() => {
    const rows = charts.machine_performance ?? [];
    return {
      labels: rows.map((row: TrendRow) => row.label),
      datasets: [
        {
          label: 'Moja wydajnosc na maszynach %',
          data: rows.map((row: TrendRow) => row.avg_performance),
          backgroundColor: 'rgba(217, 119, 6, 0.7)',
        },
      ],
    };
  }, [charts.machine_performance]);

  const queryForPage = (pageNum: number) => ({ ...filters, page: pageNum });

  return (
    <>
      <Head title="Moja wydajnosc" />
      <EmployeeLayout breadcrumbs={breadcrumbs} title="Moja wydajnosc">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi title="Moje rekordy" value={summary.total_records ?? 0} />
            <Kpi title="Srednia wydajnosc" value={formatPercent(summary.avg_performance)} />
            <Kpi title="Srednie wykorzystanie" value={formatPercent(summary.avg_usage)} />
            <Kpi title="Sredni czas zadania" value={formatSeconds(summary.avg_actual_seconds)} />
          </div>

          <div className="rounded-md border bg-white p-3">
            <h2 className="mb-3 text-sm font-semibold">Filtry</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <input
                className="rounded border px-2 py-1.5 text-sm"
                placeholder="Szukaj po maszynie, wydziale lub nazwie"
                value={filters.search ?? ''}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              />
              <input
                type="date"
                className="rounded border px-2 py-1.5 text-sm"
                value={filters.date_from ?? ''}
                onChange={(event) => setFilters((prev) => ({ ...prev, date_from: event.target.value }))}
              />
              <input
                type="date"
                className="rounded border px-2 py-1.5 text-sm"
                value={filters.date_to ?? ''}
                onChange={(event) => setFilters((prev) => ({ ...prev, date_to: event.target.value }))}
              />
              <select
                className="rounded border px-2 py-1.5 text-sm"
                value={filters.per_page ?? 15}
                onChange={(event) => setFilters((prev) => ({ ...prev, per_page: Number(event.target.value) }))}
              >
                {[10, 15, 25, 50].map((perPage) => (
                  <option key={perPage} value={perPage}>
                    {perPage} / strone
                  </option>
                ))}
              </select>

              <select
                className="rounded border px-2 py-1.5 text-sm"
                value={filters.machine_id ?? ''}
                onChange={(event) => setFilters((prev) => ({ ...prev, machine_id: event.target.value ? Number(event.target.value) : null }))}
              >
                <option value="">Wszystkie moje maszyny</option>
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center text-xs text-gray-500">
                Filtry odswiezaja wszystkie sekcje automatycznie.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <Panel title="Trend mojej wydajnosci (14 dni)">
              <div className="h-72">
                <Line data={selfTrendChart} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </Panel>

            <Panel title="Ranking mojego wydzialu">
              <div className="h-72">
                <Bar data={departmentRankingChart} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </Panel>

            <Panel id="machine-performance-section" title="Przekroj mojej wydajnosci na maszynach" className="xl:col-span-2">
              <div className="h-72">
                <Bar data={machineChart} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </Panel>
          </div>

          <Panel title="Maszyny, na ktorych pracowalem">
            <div className="space-y-4">
              {employeeMachineDetails.length === 0 ? (
                <EmptyState text="Brak danych dla maszyn w wybranym zakresie." />
              ) : (
                employeeMachineDetails.map((machine) => (
                  <div key={machine.machine_id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{machine.label}</h3>
                        <p className="text-xs text-slate-500">Ostatnia aktywnosc: {machine.last_occurred_at ?? '-'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        <MiniStat label="Srednia norma" value={formatPercent(machine.avg_performance)} />
                        <MiniStat label="Wykorzystanie" value={formatPercent(machine.avg_usage)} />
                        <MiniStat label="Liczba rekordow" value={machine.items_count} />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-2 pr-3 text-left font-medium">Data</th>
                            <th className="py-2 pr-3 text-left font-medium">Operacja</th>
                            <th className="py-2 pr-3 text-left font-medium">Norma (s)</th>
                            <th className="py-2 pr-3 text-left font-medium">Rzeczywisty (s)</th>
                            <th className="py-2 pr-3 text-left font-medium">Norma %</th>
                            <th className="py-2 text-left font-medium">Wykorzystanie %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {machine.history.map((row) => (
                            <tr key={row.id} className="border-b border-slate-200 last:border-0">
                              <td className="py-2 pr-3">{row.occurred_at}</td>
                              <td className="py-2 pr-3">{row.operation}</td>
                              <td className="py-2 pr-3">{row.norm_required_seconds}</td>
                              <td className="py-2 pr-3">{row.actual_task_seconds}</td>
                              <td className="py-2 pr-3 font-medium">{formatPercent(row.norm_performance_percent)}</td>
                              <td className="py-2">{formatPercent(row.norm_usage_percent)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Moja szczegolowa historia wydajnosci">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 pr-3 text-left">Data</th>
                    <th className="py-2 pr-3 text-left">Wydzial</th>
                    <th className="py-2 pr-3 text-left">Maszyna</th>
                    <th className="py-2 pr-3 text-left">Operacja</th>
                    <th className="py-2 pr-3 text-left">Norma (s)</th>
                    <th className="py-2 pr-3 text-left">Rzeczywisty (s)</th>
                    <th className="py-2 pr-3 text-left">Norma %</th>
                    <th className="py-2 text-left">Wykorzystanie %</th>
                  </tr>
                </thead>
                <tbody>
                  {(records.data as Row[]).map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">{row.occurred_at}</td>
                      <td className="py-2 pr-3">{row.department}</td>
                      <td className="py-2 pr-3">{row.machine}</td>
                      <td className="py-2 pr-3">{row.operation}</td>
                      <td className="py-2 pr-3">{row.norm_required_seconds}</td>
                      <td className="py-2 pr-3">{row.actual_task_seconds}</td>
                      <td className="py-2 pr-3 font-semibold">{formatPercent(row.norm_performance_percent)}</td>
                      <td className="py-2">{formatPercent(row.norm_usage_percent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <div>
                Strona {records.current_page} z {records.last_page} - rekordow: {records.total}
              </div>
              <div className="flex items-center gap-2">
                {records.current_page > 1 ? (
                  <Link className="rounded border px-2 py-1" href="/employee/performance" data={queryForPage(records.current_page - 1)}>
                    Poprzednia
                  </Link>
                ) : (
                  <span className="rounded border px-2 py-1 text-gray-400">Poprzednia</span>
                )}
                {records.current_page < records.last_page ? (
                  <Link className="rounded border px-2 py-1" href="/employee/performance" data={queryForPage(records.current_page + 1)}>
                    Nastepna
                  </Link>
                ) : (
                  <span className="rounded border px-2 py-1 text-gray-400">Nastepna</span>
                )}
              </div>
            </div>
          </Panel>
        </div>
      </EmployeeLayout>
    </>
  );
}

function Panel({
  title,
  children,
  className = '',
  id,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`rounded-md border bg-white p-3 ${className}`.trim()}>
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-slate-500">{text}</p>;
}

