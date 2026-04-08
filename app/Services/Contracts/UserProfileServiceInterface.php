<?php

namespace App\Services\Contracts;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Http\UploadedFile;

interface UserProfileServiceInterface
{
    public function checkProfileCompletion(int $userId): bool;

    public function getCompanyDataByNip(string $nip): array;

    public function validateNip(string $nip): bool;

    public function getUserProfileByUserId(?int $userId = null): ?array;

    public function getProfile(User $user): ?UserProfile;

    public function createProfile(User $user, array $data): UserProfile;

    public function updateProfile(UserProfile $profile, array $data): UserProfile;

    public function storeProfilePhoto(UploadedFile $file, User $user): string;

    public function getAddressData(?int $userId = null): ?array;
}
