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
import ModeratorLayout from '@/layouts/ModeratorLayout';
import echo from '@/lib/echo';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

type Option = { id: number; name: string };

type Filters = {
  search: string;
  date_from: string;
  date_to: string;
  department_id: number | null;
  user_id: number | null;
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

export default function ModeratorPerformancePage() {
  const page = usePage().props as any;
  const summary = page.summary ?? {};
  const charts = page.charts ?? {};
  const records = page.records ?? { data: [], current_page: 1, last_page: 1 };
  const filterOptions = page.filterOptions ?? { departments: [], users: [], machines: [] };
  const initialFilters = page.filters as Filters;

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const isFirstFilterRender = useRef(true);

  useEffect(() => {
    const channel = echo.private('performance.moderator');
    channel.listen('.PerformanceUpdated', () => {
      router.reload({ only: ['summary', 'charts', 'records'] });
    });

    return () => {
      channel.stopListening('.PerformanceUpdated');
      echo.leaveChannel('private-performance.moderator');
    };
  }, []);

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

  const breadcrumbs = [{ label: 'Wydajnosc', href: '/moderator/performance' }];

  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.get('/moderator/performance', filters as any, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [filters]);

  const resetFilters = () => {
    const next = {
      search: '',
      date_from: '',
      date_to: '',
      department_id: null,
      user_id: null,
      machine_id: null,
      per_page: 15,
    };
    setFilters(next);
    router.get('/moderator/performance', next as any, { preserveState: true, replace: true });
  };

  const departmentChart = useMemo(() => {
    const rows = charts.department_performance ?? [];
    return {
      labels: rows.map((r: any) => r.label),
      datasets: [
        {
          label: 'Srednia wydajnosc %',
          data: rows.map((r: any) => r.avg_performance),
          backgroundColor: 'rgba(37, 99, 235, 0.7)',
        },
      ],
    };
  }, [charts.department_performance]);

  const employeeChart = useMemo(() => {
    const rows = charts.employee_performance ?? [];
    return {
      labels: rows.map((r: any) => r.label),
      datasets: [
        {
          label: 'Pracownik - srednia %',
          data: rows.map((r: any) => r.avg_performance),
          backgroundColor: 'rgba(22, 163, 74, 0.75)',
        },
      ],
    };
  }, [charts.employee_performance]);

  const machineChart = useMemo(() => {
    const rows = charts.machine_performance ?? [];
    return {
      labels: rows.map((r: any) => r.label),
      datasets: [
        {
          label: 'Maszyna - srednia %',
          data: rows.map((r: any) => r.avg_performance),
          borderColor: 'rgba(180, 83, 9, 1)',
          backgroundColor: 'rgba(180, 83, 9, 0.15)',
          tension: 0.3,
        },
      ],
    };
  }, [charts.machine_performance]);

  const queryForPage = (pageNum: number) => ({ ...filters, page: pageNum });

  return (
    <>
      <Head title="Wydajnosc" />
      <ModeratorLayout breadcrumbs={breadcrumbs} title="Wydajnosc - Moderator">
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi title="Rekordy" value={summary.total_records ?? 0} />
            <Kpi title="Srednia wydajnosc" value={`${summary.avg_performance ?? 0}%`} />
            <Kpi title="Srednie wykorzystanie normy" value={`${summary.avg_usage ?? 0}%`} />
            <Kpi title="Sredni czas zadania" value={`${summary.avg_actual_seconds ?? 0}s`} />
          </div>

          <div className="bg-white rounded-md border p-3">
            <h2 className="text-sm font-semibold mb-3">Filtry</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                className="border rounded px-2 py-1.5 text-sm"
                placeholder="Szukaj pracownika / dzialu / maszyny"
                value={filters.search ?? ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
              <input
                type="date"
                className="border rounded px-2 py-1.5 text-sm"
                value={filters.date_from ?? ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))}
              />
              <input
                type="date"
                className="border rounded px-2 py-1.5 text-sm"
                value={filters.date_to ?? ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value }))}
              />
              <select
                className="border rounded px-2 py-1.5 text-sm"
                value={filters.per_page ?? 15}
                onChange={(e) => setFilters((prev) => ({ ...prev, per_page: Number(e.target.value) }))}
              >
                {[10, 15, 25, 50].map((p) => (
                  <option key={p} value={p}>
                    {p} / strone
                  </option>
                ))}
              </select>

              <SelectField
                value={filters.department_id}
                options={filterOptions.departments as Option[]}
                placeholder="Wszystkie wydzialy"
                onChange={(value) => setFilters((prev) => ({ ...prev, department_id: value }))}
              />
              <SelectField
                value={filters.user_id}
                options={filterOptions.users as Option[]}
                placeholder="Wszyscy pracownicy"
                onChange={(value) => setFilters((prev) => ({ ...prev, user_id: value }))}
              />
              <SelectField
                value={filters.machine_id}
                options={filterOptions.machines as Option[]}
                placeholder="Wszystkie maszyny"
                onChange={(value) => setFilters((prev) => ({ ...prev, machine_id: value }))}
              />

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Filtry odswiezaja dane automatycznie.</span>
                <button onClick={resetFilters} className="px-3 py-1.5 rounded border text-sm">
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <div className="bg-white rounded-md border p-3">
              <h3 className="text-sm font-semibold mb-2">Wydzialy</h3>
              <div className="h-72">
                <Bar data={departmentChart} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white rounded-md border p-3">
              <h3 className="text-sm font-semibold mb-2">Pracownicy</h3>
              <div className="h-72">
                <Bar data={employeeChart} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            <div id="machine-performance-section" className="bg-white rounded-md border p-3 xl:col-span-2">
              <h3 className="text-sm font-semibold mb-2">Wydajnosc maszyn</h3>
              <div className="h-72">
                <Line data={machineChart} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md border p-3">
            <h3 className="text-sm font-semibold mb-2">Tabela wydajnosci</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3">Data</th>
                    <th className="text-left py-2 pr-3">Pracownik</th>
                    <th className="text-left py-2 pr-3">Wydzial</th>
                    <th className="text-left py-2 pr-3">Maszyna</th>
                    <th className="text-left py-2 pr-3">Operacja</th>
                    <th className="text-left py-2 pr-3">Norma (s)</th>
                    <th className="text-left py-2 pr-3">Rzeczywisty (s)</th>
                    <th className="text-left py-2">Wydajnosc %</th>
                  </tr>
                </thead>
                <tbody>
                  {(records.data as Row[]).map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">{row.occurred_at}</td>
                      <td className="py-2 pr-3">{row.employee}</td>
                      <td className="py-2 pr-3">{row.department}</td>
                      <td className="py-2 pr-3">{row.machine}</td>
                      <td className="py-2 pr-3">{row.operation}</td>
                      <td className="py-2 pr-3">{row.norm_required_seconds}</td>
                      <td className="py-2 pr-3">{row.actual_task_seconds}</td>
                      <td className="py-2 font-semibold">{row.norm_performance_percent ?? 0}%</td>
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
                  <Link className="px-2 py-1 border rounded" href="/moderator/performance" data={queryForPage(records.current_page - 1)}>
                    Poprzednia
                  </Link>
                ) : (
                  <span className="px-2 py-1 border rounded text-gray-400">Poprzednia</span>
                )}
                {records.current_page < records.last_page ? (
                  <Link className="px-2 py-1 border rounded" href="/moderator/performance" data={queryForPage(records.current_page + 1)}>
                    Nastepna
                  </Link>
                ) : (
                  <span className="px-2 py-1 border rounded text-gray-400">Nastepna</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </ModeratorLayout>
    </>
  );
}

function SelectField({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: number | null;
  options: Option[];
  placeholder: string;
  onChange: (value: number | null) => void;
}) {
  return (
    <select
      className="border rounded px-2 py-1.5 text-sm"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
    >
      <option value="">{placeholder}</option>
      {options.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}
