<?php

use App\Models\User;
use App\Models\Machines;
use App\Models\MachineFailure;

// =========================================================
// TESTY AWARII MASZYN
// Sprawdzają zgłaszanie awarii i historię napraw
// =========================================================

test('zalogowany użytkownik może zobaczyć stronę zgłoszenia awarii', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    $this->get(route('machines.report-failure'))->assertOk();
});

test('niezalogowany użytkownik nie może zobaczyć strony zgłoszenia awarii', function () {
    $this->get(route('machines.report-failure'))->assertRedirect(route('login'));
});

test('zgłoszenie awarii zapisuje się w bazie danych', function () {
    // Aby pracownik mógł zgłosić awarię, musi być przypisany do maszyny.
    // Testujemy kontroler bezpośrednio jako moderator (brak ograniczenia roli).
    $moderator = User::factory()->moderator()->create();
    $machine   = Machines::factory()->create();

    $this->actingAs($moderator);

    $response = $this->post(route('machines.failures.store'), [
        'machine_id'          => $machine->id,
        'failure_rank'        => 5,
        'failure_description' => 'Maszyna nie uruchamia się po weekendzie.',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('machine_failures', [
        'machine_id'          => $machine->id,
        'user_id'             => $moderator->id,
        'failure_description' => 'Maszyna nie uruchamia się po weekendzie.',
    ]);
});

test('zgłoszenie awarii wymaga opisu', function () {
    $moderator = User::factory()->moderator()->create();
    $machine   = Machines::factory()->create();

    $this->actingAs($moderator);

    $response = $this->post(route('machines.failures.store'), [
        'machine_id'   => $machine->id,
        'failure_rank' => 3,
        // brak failure_description
    ]);

    $response->assertSessionHasErrors(['failure_description']);
});

test('zgłoszenie awarii wymaga istniejącej maszyny', function () {
    $moderator = User::factory()->moderator()->create();

    $this->actingAs($moderator);

    $response = $this->post(route('machines.failures.store'), [
        'machine_id'          => 999999, // nieistniejące ID
        'failure_rank'        => 3,
        'failure_description' => 'Test',
    ]);

    $response->assertSessionHasErrors(['machine_id']);
});

test('zgłoszenie awarii wymaga rangi od 1 do 10', function () {
    $moderator = User::factory()->moderator()->create();
    $machine   = Machines::factory()->create();

    $this->actingAs($moderator);

    // Ranga = 0 (za niska)
    $this->post(route('machines.failures.store'), [
        'machine_id'          => $machine->id,
        'failure_rank'        => 0,
        'failure_description' => 'Test',
    ])->assertSessionHasErrors(['failure_rank']);

    // Ranga = 11 (za wysoka)
    $this->post(route('machines.failures.store'), [
        'machine_id'          => $machine->id,
        'failure_rank'        => 11,
        'failure_description' => 'Test',
    ])->assertSessionHasErrors(['failure_rank']);
});

test('historia awarii jest dostępna dla zalogowanego użytkownika', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    $this->get(route('machines.failures.history.index'))->assertOk();
});

test('niezalogowany użytkownik nie widzi historii awarii', function () {
    $this->get(route('machines.failures.history.index'))->assertRedirect(route('login'));
});

test('nowo zgłoszona awaria nie ma daty naprawy', function () {
    $moderator = User::factory()->moderator()->create();
    $machine   = Machines::factory()->create();

    $this->actingAs($moderator);

    $this->post(route('machines.failures.store'), [
        'machine_id'          => $machine->id,
        'failure_rank'        => 7,
        'failure_description' => 'Awaria silnika.',
    ]);

    $failure = MachineFailure::where('machine_id', $machine->id)->latest()->first();
    expect($failure)->not->toBeNull();
    expect($failure->finished_repaired_at)->toBeNull();
});

test('awaria po naprawie ma datę zamknięcia', function () {
    $failure = MachineFailure::factory()->repaired()->create();

    expect($failure->finished_repaired_at)->not->toBeNull();
});

test('moderator może edytować opis awarii', function () {
    $moderator = User::factory()->moderator()->create();
    $failure   = MachineFailure::factory()->create(['user_id' => $moderator->id]);

    $this->actingAs($moderator);

    $response = $this->put(route('machines.failures.edit.update', $failure->id), [
        'failure_description' => 'Zaktualizowany opis awarii.',
        'failure_rank'        => 8,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('machine_failures', [
        'id'                  => $failure->id,
        'failure_description' => 'Zaktualizowany opis awarii.',
    ]);
});

test('moderator może usunąć zgłoszenie awarii', function () {
    $moderator = User::factory()->moderator()->create();
    $failure   = MachineFailure::factory()->create();

    $this->actingAs($moderator);

    $response = $this->delete(route('machines.failures.destroy', $failure->id));

    $response->assertRedirect();
    $this->assertDatabaseMissing('machine_failures', ['id' => $failure->id]);
});
