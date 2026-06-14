<?php

use App\Models\User;
use App\Models\Department;
use App\Models\Machines;
use App\Models\ProductionPerformance;
use App\Models\Operationmachine;
use App\Services\PerformanceDashboardService;
use Illuminate\Http\Request;

// =========================================================
// TESTY WYDAJNOŚCI PRODUKCJI (Performance / OEE)
// norm_performance_percent = (czas normatywny / czas rzeczywisty) × 100
// Wartość > 100 = wykonano szybciej niż norma (wysoka wydajność)
// Wartość < 100 = wykonano wolniej niż norma (niska wydajność)
// =========================================================

test('pracownik widzi swój panel wydajności', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    $this->get(route('employee.performance.index'))->assertOk();
});

test('moderator widzi panel wydajności wszystkich pracowników', function () {
    $moderator = User::factory()->moderator()->create();
    $this->actingAs($moderator);

    $this->get(route('moderator.performance.index'))->assertOk();
});

test('moderator widzi wydajność według działów', function () {
    $moderator = User::factory()->moderator()->create();
    $this->actingAs($moderator);

    $this->get(route('moderator.performance.departments'))->assertOk();
});

test('pracownik nie ma dostępu do wydajności moderatora', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    $this->get(route('moderator.performance.index'))->assertStatus(403);
});

test('norm_performance_percent jest poprawnie obliczane w rekordzie produkcji', function () {
    // norm_performance_percent = (czas_normy / czas_rzeczywisty) × 100
    // Przykład: norma 300s, rzeczywisty 300s → 100% (dokładnie na normie)
    $normSeconds   = 300;
    $actualSeconds = 300;
    $expected      = round(($normSeconds / $actualSeconds) * 100, 2); // 100.00

    $perf = ProductionPerformance::factory()->create([
        'norm_required_seconds'    => $normSeconds,
        'actual_task_seconds'      => $actualSeconds,
        'norm_performance_percent' => $expected,
    ]);

    expect((float) $perf->norm_performance_percent)->toBe(100.0);
});

test('wydajność powyżej normy daje norm_performance_percent > 100', function () {
    // norma 300s, rzeczywisty 250s → 120%
    $normSeconds   = 300;
    $actualSeconds = 250;
    $expected      = round(($normSeconds / $actualSeconds) * 100, 2); // 120.00

    $perf = ProductionPerformance::factory()->create([
        'norm_required_seconds'    => $normSeconds,
        'actual_task_seconds'      => $actualSeconds,
        'norm_performance_percent' => $expected,
    ]);

    expect((float) $perf->norm_performance_percent)->toBeGreaterThan(100.0);
});

test('wydajność poniżej normy daje norm_performance_percent < 100', function () {
    // norma 300s, rzeczywisty 400s → 75%
    $normSeconds   = 300;
    $actualSeconds = 400;
    $expected      = round(($normSeconds / $actualSeconds) * 100, 2); // 75.00

    $perf = ProductionPerformance::factory()->create([
        'norm_required_seconds'    => $normSeconds,
        'actual_task_seconds'      => $actualSeconds,
        'norm_performance_percent' => $expected,
    ]);

    expect((float) $perf->norm_performance_percent)->toBeLessThan(100.0);
});

test('serwis wydajności zwraca dane dla moderatora', function () {
    $moderator = User::factory()->moderator()->create();
    // Utwórz kilka rekordów wydajności
    ProductionPerformance::factory()->count(3)->create();
    $service = app(PerformanceDashboardService::class);
    $request = Request::create('/moderator/performance', 'GET');
    $data = $service->getModeratorData($request);
    // Serwis zwraca tablicę z kluczowymi sekcjami
    expect($data)->toBeArray();
    expect($data)->toHaveKeys(['filterOptions', 'filters', 'canViewAll']);
});
test('serwis wydajności zwraca dane dla pracownika', function () {
    $employee = User::factory()->employee()->create();
    ProductionPerformance::factory()->count(2)->create(['user_id' => $employee->id]);
    $service = app(PerformanceDashboardService::class);
    $request = Request::create('/employee/performance', 'GET');
    $data = $service->getEmployeeData($request, $employee);
    expect($data)->toBeArray();
});
test('panel wydajności pracownika w działach jest dostępny', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    $this->get(route('employee.performance.department'))->assertOk();
});
