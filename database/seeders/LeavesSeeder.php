<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Leaves;

class LeavesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Dla każdego użytkownika wygeneruj 2-5 losowych wniosków urlopowych
        User::chunk(100, function ($users) {
            foreach ($users as $user) {
                Leaves::factory()->count(rand(2, 5))->forUser($user->id)->create();
            }
        });
    }
}
