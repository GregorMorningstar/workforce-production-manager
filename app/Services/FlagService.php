<?php

namespace App\Services;

use App\Services\Contracts\FlagServiceInterface;
use App\Repositories\Contracts\FlagRepositoryInterface;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class FlagService implements FlagServiceInterface
{
    public function __construct(private readonly FlagRepositoryInterface $flagRepository)
    {
    }

    public function addressFlagsByUser(): array
    {
        $profiles = $this->flagRepository->addressFlagsByUser();

    }
    public function educationFlagsByUser(): array
    {
        $educations = $this->flagRepository->educationFlagsByUser();

    }
    public function workingFlagsByUser(): array
    {
        $workings = $this->flagRepository->employmentFlagsByUser();

    }
}
