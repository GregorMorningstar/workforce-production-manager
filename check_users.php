<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Użytkowników: " . \App\Models\User::count() . "\n";
echo "Departamentów: " . \App\Models\Department::count() . "\n\n";

echo "Lista użytkowników:\n";
echo str_repeat('-', 80) . "\n";

\App\Models\User::with('department')->get()->each(function($user) {
    echo sprintf(
        "%-30s | %-10s | %-30s | %s\n",
        $user->email,
        $user->role,
        $user->department?->name ?? 'Brak',
        $user->barcode
    );
});

echo "\nFixedusers (admin/moderator/employee):\n";
echo str_repeat('-', 80) . "\n";

\App\Models\User::whereIn('email', ['admin@test.com', 'moderator@test.com', 'employee@test.com'])
    ->get()
    ->each(function($user) {
        echo sprintf(
            "%s => %s (barcode: %s)\n",
            $user->email,
            $user->role,
            $user->barcode
        );
    });
