<?php

use App\Models\User;
use App\Models\Leaves;
use App\Models\LeaveBalance;
use App\Enums\LeavesStatus;
use App\Enums\LeavesType;
use Carbon\Carbon;

// =========================================================
// TESTY URLOPÓW
// Sprawdzają składanie, zatwierdzanie i odrzucanie urlopów
// =========================================================

test('pracownik może złożyć wniosek urlopowy', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    $start = Carbon::now()->addDays(10)->format('Y-m-d');
    $end   = Carbon::now()->addDays(12)->format('Y-m-d');

    $response = $this->post(route('employee.calendar.store'), [
        'user_id'    => $employee->id,
        'start_date' => $start,
        'end_date'   => $end,
        'leave_type' => LeavesType::ANNUAL->value,
        'description'=> 'Test wniosku urlopowego',
    ]);

    $response->assertRedirect(route('employee.calendar.index'));
    $this->assertDatabaseHas('leaves', [
        'user_id'    => $employee->id,
        'start_date' => $start,
        'end_date'   => $end,
        'status'     => LeavesStatus::PENDING->value,
    ]);
});

test('nowo złożony urlop ma status oczekujący', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    $start = Carbon::now()->addDays(20)->format('Y-m-d');
    $end   = Carbon::now()->addDays(22)->format('Y-m-d');

    $this->post(route('employee.calendar.store'), [
        'user_id'    => $employee->id,
        'start_date' => $start,
        'end_date'   => $end,
        'leave_type' => LeavesType::ANNUAL->value,
    ]);

    $leave = Leaves::where('user_id', $employee->id)->latest()->first();
    expect($leave)->not->toBeNull();
    expect($leave->status)->toBe(LeavesStatus::PENDING->value);
});

test('pracownik nie może złożyć urlopu z datą wsteczną', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    $response = $this->post(route('employee.calendar.store'), [
        'user_id'    => $employee->id,
        'start_date' => Carbon::now()->subDays(5)->format('Y-m-d'),
        'end_date'   => Carbon::now()->subDays(3)->format('Y-m-d'),
        'leave_type' => LeavesType::ANNUAL->value,
    ]);

    $response->assertSessionHasErrors(['start_date']);
});

test('pracownik nie może złożyć urlopu kiedy data końca jest przed datą początku', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    $response = $this->post(route('employee.calendar.store'), [
        'user_id'    => $employee->id,
        'start_date' => Carbon::now()->addDays(10)->format('Y-m-d'),
        'end_date'   => Carbon::now()->addDays(5)->format('Y-m-d'),
        'leave_type' => LeavesType::ANNUAL->value,
    ]);

    $response->assertSessionHasErrors(['end_date']);
});

test('pracownik nie może złożyć urlopu nakładającego się na istniejący', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    // Stwórz istniejący urlop
    Leaves::factory()->create([
        'user_id'    => $employee->id,
        'start_date' => Carbon::now()->addDays(10)->format('Y-m-d'),
        'end_date'   => Carbon::now()->addDays(15)->format('Y-m-d'),
        'status'     => LeavesStatus::APPROVED->value,
    ]);

    // Próba złożenia nakładającego się urlopu
    $response = $this->post(route('employee.calendar.store'), [
        'user_id'    => $employee->id,
        'start_date' => Carbon::now()->addDays(13)->format('Y-m-d'),
        'end_date'   => Carbon::now()->addDays(17)->format('Y-m-d'),
        'leave_type' => LeavesType::ANNUAL->value,
    ]);

    $response->assertSessionHasErrors();
});

test('moderator może zatwierdzić wniosek urlopowy', function () {
    $moderator = User::factory()->moderator()->create();
    $employee  = User::factory()->employee()->create();

    $leave = Leaves::factory()->create([
        'user_id' => $employee->id,
        'status'  => LeavesStatus::PENDING->value,
    ]);

    $this->actingAs($moderator);

    $response = $this->put(route('moderator.leaves.status.update', $leave->id), [
        'status' => 'approved',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('leaves', [
        'id'     => $leave->id,
        'status' => LeavesStatus::APPROVED->value,
    ]);
});

test('moderator może odrzucić wniosek urlopowy z podaniem powodu', function () {
    $moderator = User::factory()->moderator()->create();
    $employee  = User::factory()->employee()->create();

    $leave = Leaves::factory()->create([
        'user_id' => $employee->id,
        'status'  => LeavesStatus::PENDING->value,
    ]);

    $this->actingAs($moderator);

    $response = $this->put(route('moderator.leaves.status.update', $leave->id), [
        'status'           => 'rejected',
        'rejection_reason' => 'Konflikt z harmonogramem pracy',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('leaves', [
        'id'               => $leave->id,
        'status'           => LeavesStatus::REJECTED->value,
        'rejection_reason' => 'Konflikt z harmonogramem pracy',
    ]);
});

test('pracownik nie może zatwierdzać urlopów innych pracowników', function () {
    $employee1 = User::factory()->employee()->create();
    $employee2 = User::factory()->employee()->create();

    $leave = Leaves::factory()->create([
        'user_id' => $employee2->id,
        'status'  => LeavesStatus::PENDING->value,
    ]);

    $this->actingAs($employee1);

    $this->put(route('moderator.leaves.status.update', $leave->id), [
        'status' => 'approved',
    ])->assertStatus(403);
});

test('moderator widzi listę oczekujących urlopów', function () {
    $moderator = User::factory()->moderator()->create();
    $employee  = User::factory()->employee()->create();

    Leaves::factory()->count(3)->create([
        'user_id' => $employee->id,
        'status'  => LeavesStatus::PENDING->value,
    ]);

    $this->actingAs($moderator);

    $this->get(route('moderator.leaves.pending'))->assertOk();
});

test('pracownik widzi swój kalendarz urlopów', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    $this->get(route('employee.calendar.index'))->assertOk();
});

test('pracownik widzi historię swoich urlopów', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    $this->get(route('employee.calendar.history'))->assertOk();
});
