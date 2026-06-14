<?php

use App\Models\User;
use App\Enums\UserRole;

// =========================================================
// TESTY KONTROLI DOSTĘPU – RoleMiddleware
// Sprawdzają czy każda rola widzi tylko swoje strony
// =========================================================

test('niezalogowany użytkownik jest przekierowywany do logowania', function () {
    $this->get('/dashboard')->assertRedirect(route('login'));
});

test('niezalogowany użytkownik nie ma dostępu do panelu moderatora', function () {
    $this->get('/moderator/dashboard')->assertRedirect(route('login'));
});

test('niezalogowany użytkownik nie ma dostępu do panelu pracownika', function () {
    $this->get('/employee/production/my')->assertRedirect(route('login'));
});

test('pracownik nie ma dostępu do panelu moderatora', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    $this->get('/moderator/dashboard')->assertStatus(403);
});

test('pracownik nie ma dostępu do listy użytkowników', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    $this->get('/moderator/users')->assertStatus(403);
});

test('pracownik nie ma dostępu do zarządzania działami', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    $this->get('/moderator/departments')->assertStatus(403);
});

test('moderator ma dostęp do swojego panelu', function () {
    $moderator = User::factory()->moderator()->create();
    $this->actingAs($moderator);

    $this->get('/moderator/dashboard')->assertOk();
});

test('moderator ma dostęp do listy użytkowników', function () {
    $moderator = User::factory()->moderator()->create();
    $this->actingAs($moderator);

    $this->get('/moderator/users')->assertOk();
});

test('moderator nie ma dostępu do panelu pracownika', function () {
    $moderator = User::factory()->moderator()->create();
    $this->actingAs($moderator);

    $this->get('/employee/production/my')->assertStatus(403);
});

test('pracownik ma dostęp do swojego dashboardu', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    $this->get('/employee/production/my')->assertOk();
});

test('pracownik ma dostęp do historii produkcji', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    $this->get('/employee/production/history')->assertOk();
});

test('pracownik ma dostęp do kalendarza urlopów', function () {
    $employee = User::factory()->employee()->create();
    $this->actingAs($employee);

    $this->get('/employee/calendar')->assertOk();
});
