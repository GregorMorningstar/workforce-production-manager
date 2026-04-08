<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Automatyczne generowanie balansów urlopowych na nowy rok
// Uruchamia się 31 grudnia o 23:59
Schedule::command('leave:generate-yearly', ['--year' => date('Y') + 1])
    ->yearlyOn(12, 31, '23:59')
    ->description('Generate leave balances for next year');
