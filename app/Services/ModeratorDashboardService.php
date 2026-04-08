<?php

namespace App\Services;

use App\Enums\LeavesStatus;
use App\Enums\LeavesType;
use App\Enums\OrderItemProductionPlanStatus;
use App\Models\Department;
use App\Models\Leaves;
use App\Models\MachineFailure;
use App\Models\Machines;
use App\Models\OrderItemProductionPlan;
use App\Models\User;
use Carbon\Carbon;

class ModeratorDashboardService
{
    public function __construct(
        private readonly Leaves $leaves,
        private readonly MachineFailure $machineFailure,
        private readonly OrderItemProductionPlan $orderItemProductionPlan,
        private readonly Department $department,
        private readonly Machines $machines,
        private readonly User $user,
    ) {
    }

    public function getDashboardData(): array
    {
        $labels = [];
        $failuresSeries = [];
        $leavesSeries = [];
        $productionSeries = [];
        $dailyLeaveLabels = [];
        $dailyLeaveSeries = [];
        $dailyLeaveDateKeys = [];
        $dailyLeaveDetailsByDay = [];
        $departmentMachineLabels = [];
        $departmentMachineSeries = [];
        $departmentFailureSeries = [];
        $failuresByDepartment = [];

        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $labels[] = $date->translatedFormat('M Y');

            $failuresSeries[] = $this->machineFailure->newQuery()
                ->whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();

            $leavesSeries[] = $this->leaves->newQuery()
                ->whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();

            $productionSeries[] = $this->orderItemProductionPlan->newQuery()
                ->whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
        }

        $pendingLeaves = $this->leaves->newQuery()
            ->where('status', LeavesStatus::PENDING->value)
            ->count();

        $approvedLeaves = $this->leaves->newQuery()
            ->where('status', LeavesStatus::APPROVED->value)
            ->count();

        $rejectedLeaves = $this->leaves->newQuery()
            ->where('status', LeavesStatus::REJECTED->value)
            ->count();

        $departmentsCount = $this->department->newQuery()->count();
        $machinesCount = $this->machines->newQuery()->count();
        $departmentsWithMachineCount = $this->department->newQuery()
            ->withCount(['machines', 'machineFailures'])
            ->orderBy('name')
            ->get(['id', 'name']);

        foreach ($departmentsWithMachineCount as $department) {
            $departmentMachineLabels[] = (string) $department->name;
            $departmentMachineSeries[] = (int) $department->machines_count;
            $departmentFailureSeries[] = (int) $department->machine_failures_count;
            $failuresByDepartment[(string) $department->name] = [];
        }

        $employeesCount = $this->user->newQuery()->where('role', 'employee')->count();
        $allFailures = $this->machineFailure->newQuery()->count();
        $allLeaves = $this->leaves->newQuery()->count();

        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();

        $todayLeaves = $this->leaves->newQuery()
            ->where('status', LeavesStatus::APPROVED->value)
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->count();

        $tomorrowLeaves = $this->leaves->newQuery()
            ->where('status', LeavesStatus::APPROVED->value)
            ->whereDate('start_date', '<=', $tomorrow)
            ->whereDate('end_date', '>=', $tomorrow)
            ->count();

        $failuresToday = $this->machineFailure->newQuery()
            ->whereDate('created_at', $today)
            ->count();

        for ($i = 0; $i < 7; $i++) {
            $day = Carbon::today()->addDays($i);
            $dailyLeaveLabels[] = $day->translatedFormat('d M');
            $dailyLeaveDateKeys[] = $day->toDateString();
            $dailyLeaveSeries[] = $this->leaves->newQuery()
                ->where('status', LeavesStatus::APPROVED->value)
                ->whereDate('start_date', '<=', $day)
                ->whereDate('end_date', '>=', $day)
                ->count();

            $dayLeaves = $this->leaves->newQuery()
                ->with('user:id,name')
                ->where('status', LeavesStatus::APPROVED->value)
                ->whereDate('start_date', '<=', $day)
                ->whereDate('end_date', '>=', $day)
                ->orderBy('start_date')
                ->get(['id', 'user_id', 'start_date', 'end_date', 'type', 'status', 'description']);

            $dailyLeaveDetailsByDay[$day->toDateString()] = $dayLeaves->map(function ($leave) {
                $typeEnum = LeavesType::fromDatabase((string) $leave->type);
                $statusEnum = LeavesStatus::tryFrom((string) $leave->status);

                return [
                    'id' => $leave->id,
                    'employee' => $leave->user?->name ?? '-',
                    'start_date' => (string) $leave->start_date,
                    'end_date' => (string) $leave->end_date,
                    'type' => $typeEnum?->label() ?? (string) $leave->type,
                    'status' => $statusEnum?->label() ?? (string) $leave->status,
                    'description' => $leave->description,
                ];
            })->values()->all();
        }

        $activeProduction = $this->orderItemProductionPlan->newQuery()
            ->where('status', OrderItemProductionPlanStatus::ROZPOCZETO_PROCES->value)
            ->count();

        $completedProduction = $this->orderItemProductionPlan->newQuery()
            ->where('status', OrderItemProductionPlanStatus::ZAKONCZONO_PROCES->value)
            ->count();

        $allProduction = $this->orderItemProductionPlan->newQuery()->count();

        $inProgressProcessDetails = $this->orderItemProductionPlan->newQuery()
            ->with(['assignedUser:id,name', 'machine:id,name', 'operation:id,operation_name'])
            ->where('status', OrderItemProductionPlanStatus::ROZPOCZETO_PROCES->value)
            ->orderByDesc('planned_start_at')
            ->limit(50)
            ->get([
                'id',
                'assigned_user_id',
                'machine_id',
                'operationmachine_id',
                'planned_start_at',
                'status',
            ])
            ->map(fn ($plan) => [
                'id' => $plan->id,
                'employee' => $plan->assignedUser?->name ?? '-',
                'machine' => $plan->machine?->name ?? '-',
                'process' => $plan->operation?->operation_name ?? '-',
                'status' => 'W toku',
                'when' => optional($plan->planned_start_at)?->format('Y-m-d H:i:s'),
            ])
            ->values();

        $completedProcessDetails = $this->orderItemProductionPlan->newQuery()
            ->with(['assignedUser:id,name', 'machine:id,name', 'operation:id,operation_name'])
            ->where('status', OrderItemProductionPlanStatus::ZAKONCZONO_PROCES->value)
            ->orderByDesc('planned_end_at')
            ->limit(50)
            ->get([
                'id',
                'assigned_user_id',
                'machine_id',
                'operationmachine_id',
                'planned_end_at',
                'status',
            ])
            ->map(fn ($plan) => [
                'id' => $plan->id,
                'employee' => $plan->assignedUser?->name ?? '-',
                'machine' => $plan->machine?->name ?? '-',
                'process' => $plan->operation?->operation_name ?? '-',
                'status' => 'Wykonane',
                'when' => optional($plan->planned_end_at)?->format('Y-m-d H:i:s'),
            ])
            ->values();

        $recentFailures = $this->machineFailure->newQuery()
            ->with(['machine:id,name,department_id', 'machine.department:id,name', 'user:id,name'])
            ->orderByDesc('reported_at')
            ->limit(200)
            ->get([
                'id',
                'machine_id',
                'user_id',
                'failure_description',
                'reported_at',
            ]);

        foreach ($recentFailures as $failure) {
            $departmentName = (string) ($failure->machine?->department?->name ?? 'Brak wydzialu');
            if (!array_key_exists($departmentName, $failuresByDepartment)) {
                $failuresByDepartment[$departmentName] = [];
            }

            $failuresByDepartment[$departmentName][] = [
                'id' => $failure->id,
                'machine' => $failure->machine?->name ?? '-',
                'reported_by' => $failure->user?->name ?? '-',
                'reported_at' => optional($failure->reported_at)->format('Y-m-d H:i:s'),
                'description' => $failure->failure_description,
            ];
        }

        $efficiencyRate = $allProduction > 0
            ? round(($completedProduction / $allProduction) * 100, 2)
            : 0.0;

        $employeeEfficiency = $employeesCount > 0
            ? round($completedProduction / $employeesCount, 2)
            : 0.0;

        $normValues = [];
        $completedPlansNotes = $this->orderItemProductionPlan->newQuery()
            ->where('status', OrderItemProductionPlanStatus::ZAKONCZONO_PROCES->value)
            ->whereNotNull('assigned_user_id')
            ->get(['notes']);

        foreach ($completedPlansNotes as $plan) {
            $notes = is_string($plan->notes) ? json_decode($plan->notes, true) : null;
            if (!is_array($notes)) {
                continue;
            }

            $value = $notes['norm_performance_percent'] ?? null;
            if ($value !== null && is_numeric($value)) {
                $normValues[] = (float) $value;
            }
        }

        $avgNormAllEmployees = !empty($normValues)
            ? round(array_sum($normValues) / count($normValues), 2)
            : 0.0;

        $normSamplesCount = count($normValues);

        return [
            'timeLabels' => $labels,
            'failuresSeries' => $failuresSeries,
            'leavesSeries' => $leavesSeries,
            'productionSeries' => $productionSeries,
            'pendingLeaves' => $pendingLeaves,
            'approvedLeaves' => $approvedLeaves,
            'rejectedLeaves' => $rejectedLeaves,
            'departmentsCount' => $departmentsCount,
            'machinesCount' => $machinesCount,
            'departmentMachineLabels' => $departmentMachineLabels,
            'departmentMachineSeries' => $departmentMachineSeries,
            'departmentFailureSeries' => $departmentFailureSeries,
            'employeesCount' => $employeesCount,
            'allFailures' => $allFailures,
            'allLeaves' => $allLeaves,
            'todayLeaves' => $todayLeaves,
            'tomorrowLeaves' => $tomorrowLeaves,
            'failuresToday' => $failuresToday,
            'activeProduction' => $activeProduction,
            'completedProduction' => $completedProduction,
            'efficiencyRate' => $efficiencyRate,
            'employeeEfficiency' => $employeeEfficiency,
            'avgNormAllEmployees' => $avgNormAllEmployees,
            'normSamplesCount' => $normSamplesCount,
            'dailyLeaveLabels' => $dailyLeaveLabels,
            'dailyLeaveDateKeys' => $dailyLeaveDateKeys,
            'dailyLeaveSeries' => $dailyLeaveSeries,
            'dailyLeaveDetailsByDay' => $dailyLeaveDetailsByDay,
            'inProgressProcessDetails' => $inProgressProcessDetails,
            'completedProcessDetails' => $completedProcessDetails,
            'failuresByDepartment' => $failuresByDepartment,
        ];
    }
}
