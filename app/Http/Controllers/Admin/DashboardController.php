<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminDashboardService;

class DashboardController extends Controller
{
    public function index(AdminDashboardService $dashboardService)
    {
        return inertia('admin/dashboard/index', $dashboardService->getOverview());
    }
}
