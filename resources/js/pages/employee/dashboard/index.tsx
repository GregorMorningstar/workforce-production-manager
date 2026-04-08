import EmployeeLayout from "@/layouts/EmployeeLayout";
import { Head, Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import plLocale from '@fullcalendar/core/locales/pl';

ChartJS.register(ArcElement, Tooltip, Legend);

type LeaveHistoryRow = {
  id: number;
  start_date: string;
  end_date: string;
  type: string;
  status: string;
  description?: string | null;
};

type AssignedMachine = {
  id: number;
  name: string;
  barcode: string;
  department?: string | null;
  productionUrl: string;
};

type LeaveCalendarEvent = {
  id: number;
  start_date: string;
  end_date: string;
  type: string;
  type_label: string;
  status: string;
  status_label: string;
  description?: string | null;
};

type EfficiencyDetailRow = {
  id: number;
  process: string;
  machine: string;
  started_at?: string | null;
  finished_at?: string | null;
  norm_seconds: number;
  norm_minutes: number;
  performance_percent?: number | null;
};

export default function EmployeeDashboard() {
    const {
      leaveSummary = {
        year: new Date().getFullYear(),
        entitlementDays: 0,
        usedDays: 0,
        remainingDays: 0,
        pendingRequests: 0,
      },
      leaveHistory = [] as LeaveHistoryRow[],
      leaveCalendarEvents = [] as LeaveCalendarEvent[],
      efficiencyDetails = [] as EfficiencyDetailRow[],
      employeeStats = {
        totalAssignedPlans: 0,
        completedPlans: 0,
        inProgressPlans: 0,
        efficiencyRate: 0,
        avgNormPerformance: 0,
      },
      assignedMachines = [] as AssignedMachine[],
    } = (usePage().props as any);

    const [showLeaveCalendar, setShowLeaveCalendar] = useState(false);
    const [selectedLeaveDetails, setSelectedLeaveDetails] = useState<LeaveCalendarEvent | null>(null);




    const breadcrumbs = [
        { label: 'Panel Pracownika', href: '/employee/dashboard' },
    ];

    const leaveUsageChartData = {
      labels: ['Wykorzystane dni', 'Pozostale dni'],
      datasets: [
        {
          data: [leaveSummary.usedDays, leaveSummary.remainingDays],
          backgroundColor: ['rgba(249, 115, 22, 0.85)', 'rgba(16, 185, 129, 0.85)'],
          borderColor: ['rgba(249, 115, 22, 1)', 'rgba(16, 185, 129, 1)'],
          borderWidth: 1,
        },
      ],
    };

    const calendarEvents = useMemo(() => {
      return leaveCalendarEvents.map((leave: LeaveCalendarEvent) => ({
        id: String(leave.id),
        title: `${leave.type_label} (${leave.status_label})`,
        start: leave.start_date,
        end: leave.end_date,
        allDay: true,
        backgroundColor: leave.status === 'approved' ? '#10b981' : leave.status === 'rejected' ? '#ef4444' : '#3b82f6',
        borderColor: leave.status === 'approved' ? '#10b981' : leave.status === 'rejected' ? '#ef4444' : '#3b82f6',
        extendedProps: {
          details: leave,
        },
      }));
    }, [leaveCalendarEvents]);

  return (
    <>
      <Head title="Panel pracownika" />
      <EmployeeLayout breadcrumbs={breadcrumbs} title="Panel pracownika">
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes popIn {
            from { opacity: 0; transform: scale(0.97); }
            to { opacity: 1; transform: scale(1); }
          }
          .emp-fade-up { animation: fadeUp 480ms ease-out both; }
          .emp-pop-in { animation: popIn 420ms ease-out both; }
          .emp-delay-1 { animation-delay: 80ms; }
          .emp-delay-2 { animation-delay: 160ms; }
        `}</style>

        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="bg-white rounded-lg shadow p-4 emp-pop-in">
              <p className="text-xs uppercase text-gray-500">Urlop roczny ({leaveSummary.year})</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{leaveSummary.entitlementDays}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 emp-pop-in emp-delay-1">
              <p className="text-xs uppercase text-gray-500">Wykorzystane dni</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{leaveSummary.usedDays}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 emp-pop-in emp-delay-2">
              <p className="text-xs uppercase text-gray-500">Pozostalo dni</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{leaveSummary.remainingDays}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs uppercase text-gray-500">Wnioski oczekujace</p>
              <p className="text-2xl font-bold text-indigo-700 mt-1">{leaveSummary.pendingRequests}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs uppercase text-gray-500">Procesy zakonczone</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{employeeStats.completedPlans}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs uppercase text-gray-500">Zaplanowane czynnosci</p>
              <p className="text-2xl font-bold text-cyan-700 mt-1">{employeeStats.efficiencyRate}%</p>
              <p className="text-xs text-cyan-800 mt-1">zrobione</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 emp-fade-up">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs uppercase text-gray-500">Norma (srednie wykonanie)</p>
              <p className="text-2xl font-bold text-violet-700 mt-1">{employeeStats.avgNormPerformance}%</p>
              <p className="text-xs text-gray-500 mt-1">srednia z zakonczonych procesow</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs uppercase text-gray-500">Ile procesow wykonanych</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{employeeStats.completedPlans}</p>
              <p className="text-xs text-gray-500 mt-1">liczba procesow ze statusem zakonczono</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-4 xl:col-span-2 emp-fade-up">
              <h2 className="text-lg font-semibold mb-3">Historia urlopow (ostatnie 5)</h2>
              {leaveHistory.length === 0 ? (
                <p className="text-sm text-gray-500">Brak historii urlopow.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-3">Od</th>
                        <th className="text-left py-2 pr-3">Do</th>
                        <th className="text-left py-2 pr-3">Typ</th>
                        <th className="text-left py-2 pr-3">Status</th>
                        <th className="text-left py-2">Opis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveHistory.map((leave: LeaveHistoryRow) => (
                        <tr key={leave.id} className="border-b last:border-b-0">
                          <td className="py-2 pr-3">{leave.start_date}</td>
                          <td className="py-2 pr-3">{leave.end_date}</td>
                          <td className="py-2 pr-3">{leave.type}</td>
                          <td className="py-2 pr-3">{leave.status}</td>
                          <td className="py-2">{leave.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-4 emp-fade-up emp-delay-1">
              <h2 className="text-lg font-semibold mb-3">Wykres urlopu (dni)</h2>
              <div className="mb-6 h-44">
                <Doughnut
                  data={leaveUsageChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: () => {
                      setShowLeaveCalendar(true);
                    },
                    plugins: {
                      legend: { position: 'bottom' as const },
                    },
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowLeaveCalendar((v) => !v)}
                className="mb-5 text-xs font-medium text-indigo-700 hover:text-indigo-900"
              >
                {showLeaveCalendar ? 'Ukryj kalendarz urlopow' : 'Pokaz FullCalendar urlopow'}
              </button>
              <p className="text-sm text-gray-600 mb-6">
                Pula roczna: <span className="font-semibold">{leaveSummary.entitlementDays}</span> dni
              </p>

              <h2 className="text-lg font-semibold mb-3">Twoja produkcja</h2>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Przypisane procesy:</span> <span className="font-semibold">{employeeStats.totalAssignedPlans}</span></p>
                <p><span className="text-gray-500">W trakcie:</span> <span className="font-semibold">{employeeStats.inProgressPlans}</span></p>
                <p><span className="text-gray-500">Zakonczone:</span> <span className="font-semibold">{employeeStats.completedPlans}</span></p>
                <p><span className="text-gray-500">Wydajnosc:</span> <span className="font-semibold text-cyan-700">{employeeStats.efficiencyRate}%</span></p>
              </div>
              <Link
                href="/employee/production/my"
                className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Otworz produkcje i skaner
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 emp-fade-up emp-delay-2">
            <h2 className="text-lg font-semibold mb-3">Przypisane maszyny</h2>
            {assignedMachines.length === 0 ? (
              <p className="text-sm text-gray-500">Brak przypisanych maszyn.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {assignedMachines.map((machine: AssignedMachine) => (
                  <Link
                    key={machine.id}
                    href={machine.productionUrl}
                    className="block rounded-md border border-slate-200 bg-slate-50 p-3 hover:border-indigo-400 hover:bg-indigo-50"
                  >
                    <p className="font-semibold text-slate-800">{machine.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Barcode: {machine.barcode}</p>
                    <p className="text-xs text-slate-500">Wydzial: {machine.department || '-'}</p>
                    <p className="text-xs text-indigo-700 mt-2 font-medium">Kliknij aby przejsc do produkcji ze skanerem</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-4 emp-fade-up">
            <h2 className="text-lg font-semibold mb-3">Szczegoly wydajnosci</h2>
            {efficiencyDetails.length === 0 ? (
              <p className="text-sm text-gray-500">Brak zakonczonych procesow do analizy.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-3">Proces</th>
                      <th className="text-left py-2 pr-3">Maszyna</th>
                      <th className="text-left py-2 pr-3">Kiedy</th>
                      <th className="text-left py-2 pr-3">Norma</th>
                      <th className="text-left py-2">Wykonanie normy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {efficiencyDetails.map((row: EfficiencyDetailRow) => (
                      <tr key={row.id} className="border-b last:border-b-0">
                        <td className="py-2 pr-3">{row.process}</td>
                        <td className="py-2 pr-3">{row.machine}</td>
                        <td className="py-2 pr-3">{row.finished_at || row.started_at || '-'}</td>
                        <td className="py-2 pr-3">{row.norm_seconds}s ({row.norm_minutes} min)</td>
                        <td className="py-2">{row.performance_percent !== null && row.performance_percent !== undefined ? `${row.performance_percent}%` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {showLeaveCalendar && (
            <div className="bg-white rounded-lg shadow p-4 mt-2 emp-fade-up">
              <h2 className="text-lg font-semibold mb-3">FullCalendar - dni urlopu i szczegoly</h2>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                  <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale={plLocale}
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth',
                    }}
                    events={calendarEvents}
                    eventClick={(clickInfo) => {
                      setSelectedLeaveDetails((clickInfo.event.extendedProps?.details as LeaveCalendarEvent) ?? null);
                    }}
                    height="auto"
                  />
                </div>
                <div className="border rounded-md p-3 bg-slate-50">
                  <h3 className="text-sm font-semibold mb-2">Szczegoly urlopu</h3>
                  {!selectedLeaveDetails ? (
                    <p className="text-sm text-gray-500">Kliknij urlop w kalendarzu, aby zobaczyc szczegoly.</p>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500">Typ:</span> <span className="font-medium">{selectedLeaveDetails.type_label}</span></p>
                      <p><span className="text-gray-500">Status:</span> <span className="font-medium">{selectedLeaveDetails.status_label}</span></p>
                      <p><span className="text-gray-500">Od:</span> <span className="font-medium">{selectedLeaveDetails.start_date}</span></p>
                      <p><span className="text-gray-500">Do:</span> <span className="font-medium">{selectedLeaveDetails.end_date}</span></p>
                      <p><span className="text-gray-500">Opis:</span> <span className="font-medium">{selectedLeaveDetails.description || '-'}</span></p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </EmployeeLayout>
    </>
  );
}
