<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;

interface FlagRepositoryInterface
{
    // zwraca kolekcję rekordów user_profiles dla aktualnie zalogowanego użytkownika
    public function addressFlagsByUser(): Collection;
    public function educationFlagsByUser(): Collection;
    public function employmentFlagsByUser(): Collection;
}
