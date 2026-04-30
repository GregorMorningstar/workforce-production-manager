<?php

namespace App\Services;

use App\Models\Department;
use App\Models\Machines;
use App\Models\ProductionPerformance;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class PerformanceDashboardService
{
    public function __construct(
        private readonly ProductionPerformance $productionPerformance,
        private readonly Department $department,
        private readonly User $user,
        private readonly Machines $machines,
    ) {
    }

    public function getModeratorData(Request $request): array
    {
        $query = $this->applyFilters(
            $this->baseQuery(),
            $request,
            false,
            null,
            null
        );

        return [
            ...$this->buildSummary($query),
            ...$this->buildCharts($query),
            ...$this->buildTable($query, $request),
            'filterOptions' => $this->filterOptions(),
            'filters' => $this->normalizedFilters($request),
            'canViewAll' => true,
        ];
    }

    public function getEmployeeData(Request $request, User $authUser): array
    {
        $departmentId = (int) ($authUser->department_id ?? 0) ?: null;
        $machineIds = $this->productionPerformance->newQuery()
            ->where('user_id', (int) $authUser->id)
            ->whereNotNull('machine_id')
            ->distinct()
            ->pluck('machine_id')
            ->filter()
            ->values();

        $query = $this->applyFilters(
            $this->baseQuery(),
            $request,
            true,
            (int) $authUser->id,
            null
        );

        return [
            ...$this->buildSummary($query),
            ...$this->buildEmployeeCharts($query, $departmentId),
            ...$this->buildTable($query, $request),
            'employeeMachineDetails' => $this->buildEmployeeMachineDetails($query),
            'filterOptions' => [
                'machines' => $this->machines->newQuery()
                    ->whereIn('id', $machineIds)
                    ->orderBy('name')
                    ->get(['id', 'name'])
                    ->values(),
            ],
            'filters' => $this->normalizedFilters($request),
            'canViewAll' => false,
            'viewer' => [
                'user_id' => (int) $authUser->id,
                'department_id' => $departmentId,
            ],
        ];
    }

    public function getEmployeeDepartmentData(Request $request, User $authUser): array
    {
        $departmentId = (int) ($authUser->department_id ?? 0) ?: null;

        return [
            'departmentDetails' => $departmentId ? $this->buildDepartmentDetails($request, $departmentId) : null,
            'organizationOverview' => $this->buildOrganizationOverview($request),
            'filters' => $this->normalizedDepartmentFilters($request, $departmentId),
            'viewer' => [
                'user_id' => (int) $authUser->id,
                'department_id' => $departmentId,
            ],
        ];
    }

    public function getModeratorDepartmentData(Request $request): array
    {
        $departments = $this->department->newQuery()->orderBy('name')->get(['id', 'name'])->values();
        $selectedDepartmentId = $request->filled('department_id')
            ? (int) $request->integer('department_id')
            : (($departments->first()->id ?? null) ? (int) $departments->first()->id : null);

        return [
            'departmentDetails' => $selectedDepartmentId ? $this->buildDepartmentDetails($request, $selectedDepartmentId) : null,
            'organizationOverview' => $this->buildOrganizationOverview($request),
            'filterOptions' => [
                'departments' => $departments,
            ],
            'filters' => $this->normalizedDepartmentFilters($request, $selectedDepartmentId),
        ];
    }

    private function baseQuery(): Builder
    {
        return $this->productionPerformance->newQuery()
            ->with([
                'user:id,name',
                'department:id,name',
                'machine:id,name',
                'operation:id,operation_name',
            ]);
    }

    private function applyFilters(
        Builder $query,
        Request $request,
        bool $forceUserScope,
        ?int $userId,
        ?int $departmentId
    ): Builder {
        $query = $this->applySharedFilters($query, $request);

        if ($forceUserScope && $userId) {
            $query->where('user_id', $userId);
        } elseif ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->integer('user_id'));
        }

        if ($forceUserScope && $departmentId) {
            $query->where('department_id', $departmentId);
        } elseif ($request->filled('department_id')) {
            $query->where('department_id', (int) $request->integer('department_id'));
        }

        return $query;
    }

    private function applySharedFilters(Builder $query, Request $request): Builder
    {
        if ($request->filled('machine_id')) {
            $query->where('machine_id', (int) $request->integer('machine_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('occurred_at', '>=', (string) $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('occurred_at', '<=', (string) $request->input('date_to'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));
            $query->where(function (Builder $inner) use ($search) {
                $inner->whereHas('user', fn (Builder $userQuery) => $userQuery->where('name', 'like', '%' . $search . '%'))
                    ->orWhereHas('department', fn (Builder $departmentQuery) => $departmentQuery->where('name', 'like', '%' . $search . '%'))
                    ->orWhereHas('machine', fn (Builder $machineQuery) => $machineQuery->where('name', 'like', '%' . $search . '%'));
            });
        }

        return $query;
    }

    private function buildSummary(Builder $query): array
    {
        $base = clone $query;

        return [
            'summary' => [
                'total_records' => (clone $base)->count(),
                'avg_performance' => round((float) ((clone $base)->avg('norm_performance_percent') ?? 0), 2),
                'avg_usage' => round((float) ((clone $base)->avg('norm_usage_percent') ?? 0), 2),
                'avg_actual_seconds' => round((float) ((clone $base)->avg('actual_task_seconds') ?? 0), 2),
            ],
        ];
    }

    private function buildCharts(Builder $query): array
    {
        $base = clone $query;

        $byDepartment = (clone $base)
            ->selectRaw('department_id, AVG(norm_performance_percent) as avg_perf, COUNT(*) as items_count')
            ->whereNotNull('department_id')
            ->groupBy('department_id')
            ->orderByDesc('avg_perf')
            ->with('department:id,name')
            ->limit(10)
            ->get();

        $byUser = (clone $base)
            ->selectRaw('user_id, AVG(norm_performance_percent) as avg_perf, COUNT(*) as items_count')
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->orderByDesc('avg_perf')
            ->with('user:id,name')
            ->limit(10)
            ->get();

        $byMachine = (clone $base)
            ->selectRaw('machine_id, AVG(norm_performance_percent) as avg_perf, COUNT(*) as items_count')
            ->whereNotNull('machine_id')
            ->groupBy('machine_id')
            ->orderByDesc('avg_perf')
            ->with('machine:id,name')
            ->limit(10)
            ->get();

        return [
            'charts' => [
                'department_performance' => $byDepartment->map(fn ($row) => [
                    'label' => $row->department?->name ?? 'Brak wydzialu',
                    'avg_performance' => round((float) $row->avg_perf, 2),
                    'items_count' => (int) $row->items_count,
                    'department_id' => (int) $row->department_id,
                ])->values(),
                'employee_performance' => $byUser->map(fn ($row) => [
                    'label' => $row->user?->name ?? 'Brak pracownika',
                    'avg_performance' => round((float) $row->avg_perf, 2),
                    'items_count' => (int) $row->items_count,
                    'user_id' => (int) $row->user_id,
                ])->values(),
                'machine_performance' => $byMachine->map(fn ($row) => [
                    'label' => $row->machine?->name ?? 'Brak maszyny',
                    'avg_performance' => round((float) $row->avg_perf, 2),
                    'items_count' => (int) $row->items_count,
                    'machine_id' => (int) $row->machine_id,
                ])->values(),
            ],
        ];
    }

    private function buildEmployeeCharts(Builder $query, ?int $departmentId): array
    {
        $base = clone $query;

        $trend = (clone $base)
            ->selectRaw('DATE(occurred_at) as day_key, AVG(norm_performance_percent) as avg_perf, COUNT(*) as items_count')
            ->groupBy('day_key')
            ->orderByDesc('day_key')
            ->limit(14)
            ->get()
            ->reverse()
            ->values();

        $departmentRanking = $departmentId
            ? $this->productionPerformance->newQuery()
                ->selectRaw('user_id, AVG(norm_performance_percent) as avg_perf, COUNT(*) as items_count')
                ->where('department_id', $departmentId)
                ->whereNotNull('user_id')
                ->groupBy('user_id')
                ->orderByDesc('avg_perf')
                ->with('user:id,name')
                ->limit(10)
                ->get()
            : collect();

        $machineBreakdown = (clone $base)
            ->selectRaw('machine_id, AVG(norm_performance_percent) as avg_perf, COUNT(*) as items_count')
            ->whereNotNull('machine_id')
            ->groupBy('machine_id')
            ->orderByDesc('avg_perf')
            ->with('machine:id,name')
            ->limit(10)
            ->get();

        return [
            'charts' => [
                'self_trend' => $trend->map(fn ($row) => [
                    'label' => (string) $row->day_key,
                    'avg_performance' => round((float) $row->avg_perf, 2),
                    'items_count' => (int) $row->items_count,
                ])->values(),
                'department_employee_ranking' => $departmentRanking->map(fn ($row) => [
                    'label' => $row->user?->name ?? 'Brak pracownika',
                    'avg_performance' => round((float) $row->avg_perf, 2),
                    'items_count' => (int) $row->items_count,
                    'user_id' => (int) $row->user_id,
                ])->values(),
                'machine_performance' => $machineBreakdown->map(fn ($row) => [
                    'label' => $row->machine?->name ?? 'Brak maszyny',
                    'avg_performance' => round((float) $row->avg_perf, 2),
                    'items_count' => (int) $row->items_count,
                    'machine_id' => (int) $row->machine_id,
                ])->values(),
            ],
        ];
    }

    private function buildEmployeeMachineDetails(Builder $query): array
    {
        $base = clone $query;

        $machineSummary = (clone $base)
            ->selectRaw('machine_id, AVG(norm_performance_percent) as avg_performance, AVG(norm_usage_percent) as avg_usage, COUNT(*) as items_count, MAX(occurred_at) as last_occurred_at')
            ->whereNotNull('machine_id')
            ->groupBy('machine_id')
            ->orderByDesc('last_occurred_at')
            ->with('machine:id,name')
            ->get();

        $machineHistory = (clone $base)
            ->whereNotNull('machine_id')
            ->orderByDesc('occurred_at')
            ->limit(200)
            ->get()
            ->groupBy('machine_id');

        return $machineSummary->map(function ($row) use ($machineHistory) {
            $history = ($machineHistory->get($row->machine_id) ?? collect())
                ->take(8)
                ->map(fn (ProductionPerformance $item) => [
                    'id' => $item->id,
                    'occurred_at' => optional($item->occurred_at)->format('Y-m-d H:i:s'),
                    'operation' => $item->operation?->operation_name ?? '-',
                    'norm_required_seconds' => (int) ($item->norm_required_seconds ?? 0),
                    'actual_task_seconds' => (int) ($item->actual_task_seconds ?? 0),
                    'norm_performance_percent' => $item->norm_performance_percent,
                    'norm_usage_percent' => $item->norm_usage_percent,
                ])
                ->values();

            return [
                'machine_id' => (int) $row->machine_id,
                'label' => $row->machine?->name ?? 'Brak maszyny',
                'avg_performance' => round((float) ($row->avg_performance ?? 0), 2),
                'avg_usage' => round((float) ($row->avg_usage ?? 0), 2),
                'items_count' => (int) ($row->items_count ?? 0),
                'last_occurred_at' => $row->last_occurred_at,
                'history' => $history,
            ];
        })->values()->all();
    }

    private function buildDepartmentDetails(Request $request, int $departmentId): array
    {
        $base = $this->applySharedFilters($this->baseQuery(), $request)
            ->where('department_id', $departmentId);

        $department = $this->department->newQuery()->find($departmentId, ['id', 'name']);

        $trend = (clone $base)
            ->selectRaw('DATE(occurred_at) as day_key, AVG(norm_performance_percent) as avg_performance, AVG(norm_usage_percent) as avg_usage, COUNT(*) as items_count')
            ->groupBy('day_key')
            ->orderByDesc('day_key')
            ->limit(14)
            ->get()
            ->reverse()
            ->values()
            ->map(fn ($row) => [
                'label' => (string) $row->day_key,
                'avg_performance' => round((float) ($row->avg_performance ?? 0), 2),
                'avg_usage' => round((float) ($row->avg_usage ?? 0), 2),
                'items_count' => (int) ($row->items_count ?? 0),
            ]);

        $employees = (clone $base)
            ->selectRaw('user_id, AVG(norm_performance_percent) as avg_performance, AVG(norm_usage_percent) as avg_usage, COUNT(*) as items_count')
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->orderByDesc('avg_performance')
            ->with('user:id,name')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'user_id' => (int) $row->user_id,
                'label' => $row->user?->name ?? 'Brak pracownika',
                'avg_performance' => round((float) ($row->avg_performance ?? 0), 2),
                'avg_usage' => round((float) ($row->avg_usage ?? 0), 2),
                'items_count' => (int) ($row->items_count ?? 0),
            ])
            ->values();

        $machines = (clone $base)
            ->selectRaw('machine_id, AVG(norm_performance_percent) as avg_performance, AVG(norm_usage_percent) as avg_usage, COUNT(*) as items_count')
            ->whereNotNull('machine_id')
            ->groupBy('machine_id')
            ->orderByDesc('avg_performance')
            ->with('machine:id,name')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'machine_id' => (int) $row->machine_id,
                'label' => $row->machine?->name ?? 'Brak maszyny',
                'avg_performance' => round((float) ($row->avg_performance ?? 0), 2),
                'avg_usage' => round((float) ($row->avg_usage ?? 0), 2),
                'items_count' => (int) ($row->items_count ?? 0),
            ])
            ->values();

        $recentHistory = (clone $base)
            ->orderByDesc('occurred_at')
            ->limit(12)
            ->get()
            ->map(fn (ProductionPerformance $row) => [
                'id' => $row->id,
                'occurred_at' => optional($row->occurred_at)->format('Y-m-d H:i:s'),
                'employee' => $row->user?->name ?? '-',
                'machine' => $row->machine?->name ?? '-',
                'operation' => $row->operation?->operation_name ?? '-',
                'norm_performance_percent' => $row->norm_performance_percent,
                'norm_usage_percent' => $row->norm_usage_percent,
            ])
            ->values();

        return [
            'department_id' => $departmentId,
            'department_name' => $department?->name ?? 'Brak wydzialu',
            'summary' => [
                'total_records' => (clone $base)->count(),
                'avg_performance' => round((float) ((clone $base)->avg('norm_performance_percent') ?? 0), 2),
                'avg_usage' => round((float) ((clone $base)->avg('norm_usage_percent') ?? 0), 2),
            ],
            'trend' => $trend,
            'employees' => $employees,
            'machines' => $machines,
            'recent_history' => $recentHistory,
        ];
    }

    private function buildOrganizationOverview(Request $request): array
    {
        $base = $this->applySharedFilters($this->baseQuery(), $request);

        $departments = (clone $base)
            ->selectRaw('department_id, AVG(norm_performance_percent) as avg_performance, AVG(norm_usage_percent) as avg_usage, COUNT(*) as items_count')
            ->whereNotNull('department_id')
            ->groupBy('department_id')
            ->orderByDesc('items_count')
            ->with('department:id,name')
            ->get()
            ->map(fn ($row) => [
                'department_id' => (int) $row->department_id,
                'label' => $row->department?->name ?? 'Brak wydzialu',
                'avg_performance' => round((float) ($row->avg_performance ?? 0), 2),
                'avg_usage' => round((float) ($row->avg_usage ?? 0), 2),
                'items_count' => (int) ($row->items_count ?? 0),
            ])
            ->values();

        return [
            'plant' => [
                'total_records' => (clone $base)->count(),
                'avg_performance' => round((float) ((clone $base)->avg('norm_performance_percent') ?? 0), 2),
                'avg_usage' => round((float) ((clone $base)->avg('norm_usage_percent') ?? 0), 2),
            ],
            'departments' => $departments,
        ];
    }

    private function buildTable(Builder $query, Request $request): array
    {
        $perPage = min(100, max(5, (int) $request->integer('per_page', 15)));

        /** @var LengthAwarePaginator $paginator */
        $paginator = (clone $query)
            ->orderByDesc('occurred_at')
            ->paginate($perPage)
            ->withQueryString();

        $paginator->getCollection()->transform(function (ProductionPerformance $row) {
            return [
                'id' => $row->id,
                'occurred_at' => optional($row->occurred_at)->format('Y-m-d H:i:s'),
                'employee' => $row->user?->name ?? '-',
                'department' => $row->department?->name ?? '-',
                'machine' => $row->machine?->name ?? '-',
                'operation' => $row->operation?->operation_name ?? '-',
                'norm_required_seconds' => (int) ($row->norm_required_seconds ?? 0),
                'actual_task_seconds' => (int) ($row->actual_task_seconds ?? 0),
                'norm_usage_percent' => $row->norm_usage_percent,
                'norm_performance_percent' => $row->norm_performance_percent,
            ];
        });

        return [
            'records' => $paginator,
        ];
    }

    private function filterOptions(): array
    {
        return [
            'departments' => $this->department->newQuery()->orderBy('name')->get(['id', 'name'])->values(),
            'users' => $this->user->newQuery()->where('role', 'employee')->orderBy('name')->get(['id', 'name'])->values(),
            'machines' => $this->machines->newQuery()->orderBy('name')->get(['id', 'name'])->values(),
        ];
    }

    private function normalizedFilters(Request $request): array
    {
        return [
            'search' => (string) $request->input('search', ''),
            'date_from' => (string) $request->input('date_from', ''),
            'date_to' => (string) $request->input('date_to', ''),
            'department_id' => $request->filled('department_id') ? (int) $request->integer('department_id') : null,
            'user_id' => $request->filled('user_id') ? (int) $request->integer('user_id') : null,
            'machine_id' => $request->filled('machine_id') ? (int) $request->integer('machine_id') : null,
            'per_page' => min(100, max(5, (int) $request->integer('per_page', 15))),
        ];
    }

    private function normalizedDepartmentFilters(Request $request, ?int $departmentId = null): array
    {
        return [
            'search' => (string) $request->input('search', ''),
            'date_from' => (string) $request->input('date_from', ''),
            'date_to' => (string) $request->input('date_to', ''),
            'department_id' => $request->filled('department_id')
                ? (int) $request->integer('department_id')
                : $departmentId,
        ];
    }
}
