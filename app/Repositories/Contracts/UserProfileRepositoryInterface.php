<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Http\UploadedFile;

interface UserProfileRepositoryInterface
{
    public function checkEducationCompletion(User $user): bool;
    public function checkWorkTimeCompletion(User $user): bool;
    public function checkAddressCompletion(User $user): bool;

    // Nowe metody dla UserProfile
    public function createProfile(User $user, array $data): UserProfile;
    public function updateProfile(UserProfile $profile, array $data): UserProfile;
    public function getProfile(User $user): ?UserProfile;
    public function deleteProfile(UserProfile $profile): bool;
    public function storeProfilePhoto(UploadedFile $file, User $user): string;
    public function deleteProfilePhoto(string $path): bool;
    /**
     * Zwraca model UserProfile (z sparsowanym polem `address`) lub null.
     */
    public function getAdressByUserId(?int $userId = null): ?UserProfile;
    public function findByUserId(int $userId): ?UserProfile;


    //metody dla edukacji
    public function addEducation(UserProfile $profile, array $data): UserProfile;
    public function updateEducation(UserProfile $profile, array $data): UserProfile;
    public function deleteEducation(UserProfile $profile): bool;
}
