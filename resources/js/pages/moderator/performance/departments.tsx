import { Head, router, usePage } from '@inertiajs/react';
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
};

type TrendRow = {
  label: string;
  avg_performance: number;
  avg_usage: number;
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

type DepartmentDetails = {
  department_id: number;
  department_name: string;
  summary: {
    total_records: number;
    avg_performance: number;
    avg_usage: number;
  };
  trend: TrendRow[];
  employees: RankingRow[];
  machines: RankingRow[];
  recent_history: DepartmentHistoryRow[];
};

type OrganizationDepartmentRow = {
  department_id: number;
  label: string;
  avg_performance: number;
  avg_usage: number;
  items_count: number;
};

type OrganizationOverview = {
  plant: {
    total_records: number;
    avg_performance: number;
    avg_usage: number;
  };
  departments: OrganizationDepartmentRow[];
};

function formatPercent(value: number | null | undefined) {
  return `${Number(value ?? 0).toFixed(2)}%`;
}

export default function ModeratorPerformanceDepartmentsPage() {
  const page = usePage().props as any;
  const departmentDetails = (page.departmentDetails ?? null) as DepartmentDetails | null;
  const organizationOverview = (page.organizationOverview ?? {
    plant: { total_records: 0, avg_performance: 0, avg_usage: 0 },
    departments: [],
  }) as OrganizationOverview;
  const filterOptions = page.filterOptions ?? { departments: [] };
  const initialFilters = (page.filters ?? {}) as Filters;

  const [filters, setFilters] = useState<Filters>({
    search: initialFilters.search ?? '',
    date_from: initialFilters.date_from ?? '',
    date_to: initialFilters.date_to ?? '',
    department_id: initialFilters.department_id ?? null,
  });
  const isFirstFilterRender = useRef(true);

  useEffect(() => {
    const channel = echo.private('performance.moderator');
    channel.listen('.PerformanceUpdated', () => {
      router.reload({ only: ['departmentDetails', 'organizationOverview'] });
    });

    return () => {
      channel.stopListening('.PerformanceUpdated');
      echo.leaveChannel('private-performance.moderator');
    };
  }, []);

  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.get('/moderator/performance/departments', filters as any, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [filters]);

  const departmentTrendChart = useMemo(() => {
    const rows = departmentDetails?.trend ?? [];
    return {
      labels: rows.map((row) => row.label),
      datasets: [
        {
          label: 'Norma wydzialu %',
          data: rows.map((row) => row.avg_performance),
          borderColor: 'rgba(37, 99, 235, 1)',
          backgroundColor: 'rgba(37, 99, 235, 0.18)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Wykorzystanie %',
          data: rows.map((row) => row.avg_usage),
          borderColor: 'rgba(234, 88, 12, 1)',
          backgroundColor: 'rgba(234, 88, 12, 0.12)',
          tension: 0.3,
          fill: false,
        },
      ],
    };
  }, [departmentDetails]);

  const organizationChart = useMemo(() => {
    const rows = organizationOverview.departments ?? [];
    return {
      labels: rows.map((row) => row.label),
      datasets: [
        {
          label: 'Norma %',
          data: rows.map((row) => row.avg_performance),
          backgroundColor: 'rgba(37, 99, 235, 0.75)',
        },
        {
          label: 'Wykorzystanie %',
          data: rows.map((row) => row.avg_usage),
          backgroundColor: 'rgba(22, 163, 74, 0.72)',
        },
      ],
    };
  }, [organizationOverview]);

  const breadcrumbs = [
    { label: 'Wydajnosc', href: '/moderator/performance' },
    { label: 'Szczegoly wydzialow', href: '/moderator/performance/departments' },
  ];

  return (
    <>
      <Head title="Szczegoly wydzialow" />
      <ModeratorLayout breadcrumbs={breadcrumbs} title="Szczegoly wydzialow">
        <div className="space-y-4">
          <Panel title="Filtry szczegolow wydzialow">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <SelectField
                value={filters.department_id}
                options={filterOptions.departments as Option[]}
                placeholder="Wybierz wydzial"
                onChange={(value) => setFilters((prev) => ({ ...prev, department_id: value }))}
              />
              <input
                className="rounded border px-2 py-1.5 text-sm"
                placeholder="Szukaj po pracowniku, maszynie lub wydziale"
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
            </div>
          </Panel>

          <Panel title={departmentDetails ? `Szczegoly wydzialu: ${departmentDetails.department_name}` : 'Szczegoly wydzialu'}>
            {departmentDetails ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Kpi title="Rekordy wydzialu" value={departmentDetails.summary.total_records} />
                  <Kpi title="Srednia norma" value={formatPercent(departmentDetails.summary.avg_performance)} />
                  <Kpi title="Srednie wykorzystanie" value={formatPercent(departmentDetails.summary.avg_usage)} />
                </div>

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr,1fr]">
                  <PanelInset title="Trend wydzialu (14 dni)">
                    <div className="h-72">
                      <Line data={departmentTrendChart} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                  </PanelInset>

                  <PanelInset title="Pracownicy wydzialu">
                    <SimpleMetricTable rows={departmentDetails.employees} firstColumnLabel="Pracownik" />
                  </PanelInset>
                </div>

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr,1.2fr]">
                  <PanelInset title="Maszyny wydzialu">
                    <SimpleMetricTable rows={departmentDetails.machines} firstColumnLabel="Maszyna" />
                  </PanelInset>

                  <PanelInset title="Ostatnia historia wydzialu">
                    <DepartmentHistoryTable rows={departmentDetails.recent_history} />
                  </PanelInset>
                </div>
              </div>
            ) : (
              <EmptyState text="Brak danych wydzialu dla wybranego zakresu." />
            )}
          </Panel>

          <Panel title="Przekroj wszystkich wydzialow i zakladu">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Kpi title="Rekordy zakladu" value={organizationOverview.plant.total_records} />
                <Kpi title="Srednia norma zakladu" value={formatPercent(organizationOverview.plant.avg_performance)} />
                <Kpi title="Srednie wykorzystanie zakladu" value={formatPercent(organizationOverview.plant.avg_usage)} />
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr,1fr]">
                <PanelInset title="Porownanie wydzialow">
                  <div className="h-72">
                    <Bar data={organizationChart} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </PanelInset>

                <PanelInset title="Tabela normy i wykorzystania">
                  <OrganizationTable rows={organizationOverview.departments} />
                </PanelInset>
              </div>
            </div>
          </Panel>
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
      className="rounded border px-2 py-1.5 text-sm"
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border bg-white p-3">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function PanelInset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {children}
    </div>
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

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-slate-500">{text}</p>;
}

function SimpleMetricTable({ rows, firstColumnLabel }: { rows: RankingRow[]; firstColumnLabel: string }) {
  if (rows.length === 0) {
    return <EmptyState text="Brak danych dla wybranego zakresu." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-slate-500">
            <th className="py-2 pr-3 text-left font-medium">{firstColumnLabel}</th>
            <th className="py-2 pr-3 text-left font-medium">Norma %</th>
            <th className="py-2 pr-3 text-left font-medium">Wykorzystanie %</th>
            <th className="py-2 text-left font-medium">Rekordy</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${firstColumnLabel}-${row.label}`} className="border-b last:border-0">
              <td className="py-2 pr-3">{row.label}</td>
              <td className="py-2 pr-3 font-medium">{formatPercent(row.avg_performance)}</td>
              <td className="py-2 pr-3">{formatPercent(row.avg_usage)}</td>
              <td className="py-2">{row.items_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DepartmentHistoryTable({ rows }: { rows: DepartmentHistoryRow[] }) {
  if (rows.length === 0) {
    return <EmptyState text="Brak historii wydzialu dla wybranego zakresu." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-slate-500">
            <th className="py-2 pr-3 text-left font-medium">Data</th>
            <th className="py-2 pr-3 text-left font-medium">Pracownik</th>
            <th className="py-2 pr-3 text-left font-medium">Maszyna</th>
            <th className="py-2 pr-3 text-left font-medium">Operacja</th>
            <th className="py-2 pr-3 text-left font-medium">Norma %</th>
            <th className="py-2 text-left font-medium">Wykorzystanie %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              <td className="py-2 pr-3">{row.occurred_at}</td>
              <td className="py-2 pr-3">{row.employee}</td>
              <td className="py-2 pr-3">{row.machine}</td>
              <td className="py-2 pr-3">{row.operation}</td>
              <td className="py-2 pr-3 font-medium">{formatPercent(row.norm_performance_percent)}</td>
              <td className="py-2">{formatPercent(row.norm_usage_percent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrganizationTable({ rows }: { rows: OrganizationDepartmentRow[] }) {
  if (rows.length === 0) {
    return <EmptyState text="Brak danych o wydzialach dla wybranego zakresu." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-slate-500">
            <th className="py-2 pr-3 text-left font-medium">Wydzial</th>
            <th className="py-2 pr-3 text-left font-medium">Norma %</th>
            <th className="py-2 pr-3 text-left font-medium">Wykorzystanie %</th>
            <th className="py-2 text-left font-medium">Rekordy</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.department_id} className="border-b last:border-0">
              <td className="py-2 pr-3">{row.label}</td>
              <td className="py-2 pr-3 font-medium">{formatPercent(row.avg_performance)}</td>
              <td className="py-2 pr-3">{formatPercent(row.avg_usage)}</td>
              <td className="py-2">{row.items_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
