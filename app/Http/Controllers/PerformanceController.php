<?php

namespace App\Http\Controllers;

use App\Services\PerformanceDashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PerformanceController extends Controller
{
    public function __construct(
        private readonly PerformanceDashboardService $performanceDashboardService,
    ) {
    }

    public function moderatorIndex(Request $request)
    {
        return Inertia::render(
            'moderator/performance/index',
            $this->performanceDashboardService->getModeratorData($request)
        );
    }

    public function moderatorDepartments(Request $request)
    {
        return Inertia::render(
            'moderator/performance/departments',
            $this->performanceDashboardService->getModeratorDepartmentData($request)
        );
    }

    public function employeeIndex(Request $request)
    {
        $user = Auth::user();

        abort_unless($user !== null, 403);

        return Inertia::render(
            'employee/performance/index',
            $this->performanceDashboardService->getEmployeeData($request, $user)
        );
    }

    public function employeeDepartment(Request $request)
    {
        $user = Auth::user();

        abort_unless($user !== null, 403);

        return Inertia::render(
            'employee/performance/department',
            $this->performanceDashboardService->getEmployeeDepartmentData($request, $user)
        );
    }
}
