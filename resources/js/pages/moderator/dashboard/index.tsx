import ModeratorLayout from "@/layouts/ModeratorLayout";
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

type LeaveDetailRow = {
  id: number;
  employee: string;
  start_date: string;
  end_date: string;
  type: string;
  status: string;
  description?: string | null;
};

type ProcessDetailRow = {
  id: number;
  employee: string;
  machine: string;
  process: string;
  status: string;
  when?: string | null;
};

type FailureDetailRow = {
  id: number;
  machine: string;
  reported_by: string;
  reported_at?: string | null;
  description?: string | null;
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
);

export default function ModeratorDashboard() {
  const {
    timeLabels = [],
    failuresSeries = [],
    leavesSeries = [],
    productionSeries = [],
    pendingLeaves = 0,
    approvedLeaves = 0,
    rejectedLeaves = 0,
    departmentsCount = 0,
    machinesCount = 0,
    departmentMachineLabels = [],
    departmentMachineSeries = [],
    departmentFailureSeries = [],
    employeesCount = 0,
    allFailures = 0,
    allLeaves = 0,
    todayLeaves = 0,
    tomorrowLeaves = 0,
    failuresToday = 0,
    activeProduction = 0,
    completedProduction = 0,
    efficiencyRate = 0,
    employeeEfficiency = 0,
    avgNormAllEmployees = 0,
    normSamplesCount = 0,
    dailyLeaveLabels = [],
    dailyLeaveDateKeys = [],
    dailyLeaveSeries = [],
    dailyLeaveDetailsByDay = {},
    inProgressProcessDetails = [],
    completedProcessDetails = [],
    failuresByDepartment = {},
  } = (usePage().props as any);

  const [selectedLeaveRows, setSelectedLeaveRows] = useState<LeaveDetailRow[]>([]);
  const [selectedLeaveTitle, setSelectedLeaveTitle] = useState<string>('');
  const [selectedProcessRows, setSelectedProcessRows] = useState<ProcessDetailRow[]>([]);
  const [selectedProcessTitle, setSelectedProcessTitle] = useState<string>('');
  const [selectedFailureRows, setSelectedFailureRows] = useState<FailureDetailRow[]>([]);
  const [selectedFailureTitle, setSelectedFailureTitle] = useState<string>('');

  const breadcrumbs = [
    { label: 'Panel Moderatora', href: '/moderator/dashboard' },
  ];

  const trendData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Awarie',
        data: failuresSeries,
        borderColor: 'rgba(239, 68, 68, 0.65)',
        backgroundColor: 'rgba(239, 68, 68, 0.06)',
        tension: 0.35,
        borderWidth: 1.5,
        pointRadius: 2,
      },
      {
        label: 'Urlopy',
        data: leavesSeries,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        tension: 0.35,
      },
      {
        label: 'Produkcja',
        data: productionSeries,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        tension: 0.35,
      },
    ],
  };

  const productionBarData = {
    labels: ['W toku', 'Wykonane'],
    datasets: [
      {
        label: 'Produkcja',
        data: [activeProduction, completedProduction],
        backgroundColor: ['rgba(245, 158, 11, 0.8)', 'rgba(34, 197, 94, 0.8)'],
      },
    ],
  };

  const resourceMixData = {
    labels: ['Wydzialy', 'Maszyny', 'Pracownicy'],
    datasets: [
      {
        data: [departmentsCount, machinesCount, employeesCount],
        backgroundColor: ['rgba(71, 85, 105, 0.85)', 'rgba(14, 116, 144, 0.85)', 'rgba(22, 163, 74, 0.85)'],
      },
    ],
  };

  const machinesByDepartmentData = {
    labels: departmentMachineLabels,
    datasets: [
      {
        label: 'Maszyny sprawne',
        data: departmentMachineSeries.map((machines: number, index: number) => {
          const failures = Math.min(Number(departmentFailureSeries[index] ?? 0), Number(machines));
          return Math.max(Number(machines) - failures, 0);
        }),
        backgroundColor: 'rgba(14, 116, 144, 0.78)',
      },
      {
        label: 'Maszyny w awarii',
        data: departmentMachineSeries.map((machines: number, index: number) => {
          const failures = Number(departmentFailureSeries[index] ?? 0);
          return Math.min(failures, Number(machines));
        }),
        backgroundColor: 'rgba(220, 38, 38, 0.78)',
      },
    ],
  };

  const leavesStatusData = {
    labels: ['Oczekujace', 'Zatwierdzone', 'Odrzucone'],
    datasets: [
      {
        data: [pendingLeaves, approvedLeaves, rejectedLeaves],
        backgroundColor: ['rgba(59, 130, 246, 0.85)', 'rgba(16, 185, 129, 0.85)', 'rgba(249, 115, 22, 0.85)'],
      },
    ],
  };

  const dailyLeavesBarData = {
    labels: dailyLeaveLabels,
    datasets: [
      {
        label: 'Urlopy (dzien)',
        data: dailyLeaveSeries,
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
      },
    ],
  };

  const efficiencyData = {
    labels: ['Wydajnosc', 'Pozostalo'],
    datasets: [
      {
        data: [Number(efficiencyRate), Math.max(0, 100 - Number(efficiencyRate))],
        backgroundColor: ['rgba(99, 102, 241, 0.85)', 'rgba(229, 231, 235, 0.85)'],
      },
    ],
  };

  const kpiTiles = [
    { label: 'Wydzialy', value: departmentsCount, tone: 'border-slate-300 text-slate-800' },
    { label: 'Maszyny', value: machinesCount, tone: 'border-slate-300 text-slate-800' },
    { label: 'Pracownicy', value: employeesCount, tone: 'border-slate-300 text-slate-800' },
    { label: 'Awarie (wszystkie)', value: allFailures, tone: 'border-rose-200 text-rose-700' },
    { label: 'Awarie dzisiaj', value: failuresToday, tone: 'border-rose-200 text-rose-700' },
    { label: 'Urlopy (wszystkie)', value: allLeaves, tone: 'border-sky-200 text-sky-700' },
    { label: 'Wnioski urlopowe', value: pendingLeaves, tone: 'border-sky-200 text-sky-700' },
    { label: 'Urlopy zatwierdzone', value: approvedLeaves, tone: 'border-emerald-200 text-emerald-700' },
    { label: 'Urlopy odrzucone', value: rejectedLeaves, tone: 'border-orange-200 text-orange-700' },
    { label: 'Urlopy dzisiaj', value: todayLeaves, tone: 'border-cyan-200 text-cyan-700' },
    { label: 'Urlopy jutro', value: tomorrowLeaves, tone: 'border-cyan-200 text-cyan-700' },
    { label: 'Produkcja w toku', value: activeProduction, tone: 'border-amber-200 text-amber-700' },
    { label: 'Wykonane procesy', value: completedProduction, tone: 'border-emerald-200 text-emerald-700' },
    { label: 'Srednia norma (wszyscy)', value: `${avgNormAllEmployees}%`, tone: 'border-violet-200 text-violet-700' },
    { label: 'Wydajnosc', value: `${efficiencyRate}%`, tone: 'border-indigo-200 text-indigo-700' },
  ];

  return (
    <>
      <Head title="Panel Moderatora" />
      <ModeratorLayout breadcrumbs={breadcrumbs} title="Panel Moderatora">
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
            {kpiTiles.map((tile) => (
              <div key={tile.label} className={`bg-white border rounded-md shadow-sm p-2.5 min-h-[78px] ${tile.tone}`}>
                <p className="text-[11px] uppercase tracking-wide opacity-70">{tile.label}</p>
                <p className="text-[23px] font-semibold mt-1.5 leading-none">{tile.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <div className="bg-white rounded-md shadow p-3 xl:col-span-2">
              <h2 className="text-sm font-semibold mb-2">Trend czasowy (6 ostatnich miesiecy)</h2>
              <div className="h-56">
                <Line
                  data={trendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' as const },
                    },
                    elements: {
                      point: {
                        radius: 2,
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-md shadow p-3">
              <h2 className="text-sm font-semibold mb-2">Wynik wydajnosci</h2>
              <div className="h-56">
                <Doughnut
                  data={efficiencyData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-md shadow p-3">
              <h2 className="text-sm font-semibold mb-2">Produkcja teraz</h2>
              <div className="h-52">
                <Bar
                  data={productionBarData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: (_event: unknown, elements: Array<{ index: number }>) => {
                      const barIndex = elements?.[0]?.index;
                      if (barIndex === undefined) return;

                      if (barIndex === 0) {
                        setSelectedProcessTitle('Procesy: W toku');
                        setSelectedProcessRows(inProgressProcessDetails as ProcessDetailRow[]);
                      } else {
                        setSelectedProcessTitle('Procesy: Wykonane');
                        setSelectedProcessRows(completedProcessDetails as ProcessDetailRow[]);
                      }
                    },
                    plugins: {
                      legend: { display: false },
                    },
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-md shadow p-3">
              <h2 className="text-sm font-semibold mb-2">Wydzialy i zasoby</h2>
              <div className="h-52">
                <Doughnut
                  data={resourceMixData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-md shadow p-3">
              <h2 className="text-sm font-semibold mb-2">Maszyny na wydzialach</h2>
              <div className="h-52">
                <Bar
                  data={machinesByDepartmentData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: (_event: unknown, elements: Array<{ index: number; datasetIndex: number }>) => {
                      const point = elements?.[0];
                      if (!point) return;

                      if (point.datasetIndex !== 1) return;

                      const deptName = String(departmentMachineLabels[point.index] ?? 'Brak wydzialu');
                      const rows = (failuresByDepartment?.[deptName] ?? []) as FailureDetailRow[];
                      setSelectedFailureTitle(`Awarie w wydziale: ${deptName}`);
                      setSelectedFailureRows(rows);
                    },
                    plugins: {
                      legend: { display: true, position: 'bottom' as const },
                      datalabels: {
                        display: (context: any) => context.datasetIndex === 1,
                        color: '#991b1b',
                        anchor: 'end',
                        align: 'end',
                        clamp: true,
                        font: {
                          weight: 'bold',
                          size: 10,
                        },
                        formatter: (value: number, context: any) => {
                          const index = context.dataIndex;
                          const machines = Number(departmentMachineSeries[index] ?? 0);
                          if (machines <= 0) return '0/0';
                          return `${Number(value)}/${machines}`;
                        },
                      },
                    },
                    scales: {
                      x: { stacked: true },
                      y: { stacked: true, beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-md shadow p-3">
              <h2 className="text-sm font-semibold mb-2">Statusy urlopow</h2>
              <div className="h-52">
                <Doughnut
                  data={leavesStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-md shadow p-3 md:col-span-2 xl:col-span-3">
              <h2 className="text-sm font-semibold mb-2">Urlopy w danym dniu (najblizsze 7 dni)</h2>
              <div className="h-52">
                <Bar
                  data={dailyLeavesBarData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: (_event: unknown, elements: Array<{ index: number }>) => {
                      const point = elements?.[0];
                      if (!point) return;

                      const dayIndex = point.index;
                      const dateKey = String(dailyLeaveDateKeys?.[dayIndex] ?? '');
                      const dayLabel = String(dailyLeaveLabels?.[dayIndex] ?? dateKey);
                      const rows = (dailyLeaveDetailsByDay?.[dateKey] ?? []) as LeaveDetailRow[];

                      setSelectedLeaveTitle(`Urlopy w dniu: ${dayLabel}`);
                      setSelectedLeaveRows(rows);
                    },
                    plugins: {
                      legend: { display: false },
                    },
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-md shadow p-3 md:col-span-2 xl:col-span-3">
              <h2 className="text-sm font-semibold mb-2">Szczegoly dni urlopu (kliknij slupek)</h2>
              {!selectedLeaveTitle ? (
                <p className="text-sm text-gray-500">Kliknij slupek w wykresie „Urlopy w danym dniu”, aby zobaczyc kto ma urlop.</p>
              ) : (
                <div>
                  <p className="text-sm font-medium mb-2">{selectedLeaveTitle}</p>
                  {selectedLeaveRows.length === 0 ? (
                    <p className="text-sm text-gray-500">Brak urlopow dla wybranego dnia.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-3">Pracownik</th>
                            <th className="text-left py-2 pr-3">Typ</th>
                            <th className="text-left py-2 pr-3">Status</th>
                            <th className="text-left py-2 pr-3">Od</th>
                            <th className="text-left py-2">Do</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedLeaveRows.map((row: LeaveDetailRow) => (
                            <tr key={row.id} className="border-b last:border-b-0">
                              <td className="py-2 pr-3">{row.employee}</td>
                              <td className="py-2 pr-3">{row.type}</td>
                              <td className="py-2 pr-3">{row.status}</td>
                              <td className="py-2 pr-3">{row.start_date}</td>
                              <td className="py-2">{row.end_date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-md shadow p-3 md:col-span-2 xl:col-span-3">
              <h2 className="text-sm font-semibold mb-2">Szczegoly procesow (kliknij wykres „Produkcja teraz”)</h2>
              {!selectedProcessTitle ? (
                <p className="text-sm text-gray-500">Kliknij „W toku” lub „Wykonane”, aby zobaczyc konkretne procesy.</p>
              ) : (
                <div>
                  <p className="text-sm font-medium mb-2">{selectedProcessTitle}</p>
                  {selectedProcessRows.length === 0 ? (
                    <p className="text-sm text-gray-500">Brak procesow dla wybranej kategorii.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-3">Proces</th>
                            <th className="text-left py-2 pr-3">Pracownik</th>
                            <th className="text-left py-2 pr-3">Maszyna</th>
                            <th className="text-left py-2 pr-3">Status</th>
                            <th className="text-left py-2">Kiedy</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProcessRows.map((row: ProcessDetailRow) => (
                            <tr key={row.id} className="border-b last:border-b-0">
                              <td className="py-2 pr-3">{row.process}</td>
                              <td className="py-2 pr-3">{row.employee}</td>
                              <td className="py-2 pr-3">{row.machine}</td>
                              <td className="py-2 pr-3">{row.status}</td>
                              <td className="py-2">{row.when || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-md shadow p-3 md:col-span-2 xl:col-span-3">
              <h2 className="text-sm font-semibold mb-2">Szczegoly awarii (kliknij czerwony segment na wykresie maszyn)</h2>
              {!selectedFailureTitle ? (
                <p className="text-sm text-gray-500">Kliknij czerwony segment „Maszyny w awarii”, aby zobaczyc liste awarii.</p>
              ) : (
                <div>
                  <p className="text-sm font-medium mb-2">{selectedFailureTitle}</p>
                  {selectedFailureRows.length === 0 ? (
                    <p className="text-sm text-gray-500">Brak awarii dla wybranego wydzialu.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-3">Maszyna</th>
                            <th className="text-left py-2 pr-3">Zglosil</th>
                            <th className="text-left py-2 pr-3">Data</th>
                            <th className="text-left py-2">Opis</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedFailureRows.map((row: FailureDetailRow) => (
                            <tr key={row.id} className="border-b last:border-b-0">
                              <td className="py-2 pr-3">{row.machine}</td>
                              <td className="py-2 pr-3">{row.reported_by}</td>
                              <td className="py-2 pr-3">{row.reported_at || '-'}</td>
                              <td className="py-2">{row.description || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-md shadow p-3 md:col-span-2 xl:col-span-3">
              <h2 className="text-sm font-semibold mb-2">Tabela wydajnosci pracownikow</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Metryka</th>
                      <th className="text-left py-2 pr-4">Wartosc</th>
                      <th className="text-left py-2">Opis</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 pr-4">Liczba pracownikow</td>
                      <td className="py-2 pr-4 font-semibold">{employeesCount}</td>
                      <td className="py-2">Wszyscy pracownicy z rola employee.</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4">Wykonane procesy</td>
                      <td className="py-2 pr-4 font-semibold">{completedProduction}</td>
                      <td className="py-2">Procesy zakonczone statusem zakonczono_proces.</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Wydajnosc na pracownika</td>
                      <td className="py-2 pr-4 font-semibold text-indigo-700">{employeeEfficiency}</td>
                      <td className="py-2">Wzor: wykonane procesy / liczba pracownikow.</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Srednia norma (wszyscy pracownicy)</td>
                      <td className="py-2 pr-4 font-semibold text-violet-700">{avgNormAllEmployees}%</td>
                      <td className="py-2">Srednia z norm_performance_percent dla zakonczonych czynnosci; probka: {normSamplesCount}.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </ModeratorLayout>
    </>
  );
}
