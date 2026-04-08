<?php

namespace App\Services\Contracts;
use App\Models\UserProfile;
interface FlagServiceInterface
{

    public function addressFlagsByUser(): UserProfile;
    public function educationFlagsByUser(): UserProfile;
    public function workingFlagsByUser(): UserProfile;
}
