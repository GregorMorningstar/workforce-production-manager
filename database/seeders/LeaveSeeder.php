<?php

namespace Database\Seeders;

use App\Models\Leave;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class LeaveSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Pobierz wszystkich użytkowników
        $users = User::all();

        if ($users->isEmpty()) {
            $this->command->warn('Brak użytkowników w bazie danych. Uruchom najpierw UserSeeder.');
            return;
        }

        // Stwórz losową liczbę urlopów dla każdego użytkownika
        $users->each(function ($user) {
            $leavesCount = fake()->numberBetween(2, 8); // każdy user ma 2-8 urlopów

            Leave::factory($leavesCount)->forUser($user->id)->create();
        });

        // Dodaj kilka przykładowych urlopów z konkretnym statusem
        Leave::factory(5)->approved()->create();
        Leave::factory(3)->rejected()->create();
        Leave::factory(4)->pending()->create();

        $this->command->info('Utworzono urlopy dla wszystkich użytkowników.');
        $this->command->info('Łącznie: ' . Leave::count() . ' urlopów w bazie danych.');
    }
}
