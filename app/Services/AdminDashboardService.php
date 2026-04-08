<?php

namespace App\Services;

use App\Enums\LeavesStatus;
use App\Enums\OrderItemProductionPlanStatus;
use App\Models\Department;
use App\Models\Leaves;
use App\Models\MachineFailure;
use App\Models\Machines;
use App\Models\OrderItemProductionPlan;
use App\Models\User;

class AdminDashboardService
{
    public function __construct(
        private readonly Department $department,
        private readonly Machines $machines,
        private readonly MachineFailure $machineFailure,
        private readonly User $user,
        private readonly Leaves $leaves,
        private readonly OrderItemProductionPlan $orderItemProductionPlan,
    ) {
    }

    public function getOverview(): array
    {
        $departmentsCount = $this->department->newQuery()->count();
        $machinesCount = $this->machines->newQuery()->count();
        $failuresCount = $this->machineFailure->newQuery()->count();
        $usersCount = $this->user->newQuery()->count();
        $onLeaveCount = $this->leaves->newQuery()
            ->where('status', LeavesStatus::APPROVED->value)
            ->whereDate('start_date', '<=', now())
            ->whereDate('end_date', '>=', now())
            ->count();
        $leavesCount = $this->leaves->newQuery()->count();
        $pendingLeavesCount = $this->leaves->newQuery()->where('status', LeavesStatus::PENDING->value)->count();

        $currentProductionCount = $this->orderItemProductionPlan->newQuery()
            ->where('status', OrderItemProductionPlanStatus::ROZPOCZETO_PROCES->value)
            ->count();

        $completedProductionCount = $this->orderItemProductionPlan->newQuery()
            ->where('status', OrderItemProductionPlanStatus::ZAKONCZONO_PROCES->value)
            ->count();

        $allProductionPlansCount = $this->orderItemProductionPlan->newQuery()->count();

        $efficiencyRate = $allProductionPlansCount > 0
            ? round(($completedProductionCount / $allProductionPlansCount) * 100, 2)
            : 0.0;

        return [
            'departmentsCount' => $departmentsCount,
            'machinesCount' => $machinesCount,
            'failuresCount' => $failuresCount,
            'usersCount' => $usersCount,
            'onLeaveCount' => $onLeaveCount,
            'leavesCount' => $leavesCount,
            'pendingLeavesCount' => $pendingLeavesCount,
            'currentProductionCount' => $currentProductionCount,
            'completedProductionCount' => $completedProductionCount,
            'allProductionPlansCount' => $allProductionPlansCount,
            'efficiencyRate' => $efficiencyRate,
        ];
    }
}
