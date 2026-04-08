<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('qwer1234'),
            'remember_token' => Str::random(10),
            'role' => $this->faker->randomElement(['employee','moderator','admin']),
            'department_id' => Department::inRandomOrder()->value('id') ?? null,
            'barcode' => $this->faker->unique()->numerify('2000#########'),
        ];
    }

    public function employee()
    {
        return $this->state(fn() => ['role' => 'employee']);
    }

    public function moderator()
    {
        return $this->state(fn() => ['role' => 'moderator']);
    }

    public function admin()
    {
        return $this->state(fn() => ['role' => 'admin']);
    }
}
