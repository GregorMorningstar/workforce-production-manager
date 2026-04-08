<?php

namespace App\Services;

use App\Services\Contracts\UserProfileServiceInterface;
use App\Repositories\Contracts\UserProfileRepositoryInterface;
use App\Models\User;
use App\Models\UserProfile;
use App\Services\NipService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;

class UserProfileService implements UserProfileServiceInterface
{
    public function __construct(
        private readonly UserProfileRepositoryInterface $userProfileRepository,
        private readonly NipService $nipService
    ) {
    }

    public function getProfile(User $user): ?UserProfile
    {
        return $this->userProfileRepository->getProfile($user);
    }

    public function createProfile(User $user, array $data): UserProfile
    {
        return $this->userProfileRepository->createProfile($user, $data);
    }

    public function updateProfile(UserProfile $profile, array $data): UserProfile
    {
        return $this->userProfileRepository->updateProfile($profile, $data);
    }

    public function storeProfilePhoto(UploadedFile $file, User $user): string
    {
        return $this->userProfileRepository->storeProfilePhoto($file, $user);
    }

    public function getAddressData(?int $userId = null): ?array
    {
        $userId = $userId ?? Auth::id();
        if (! $userId) {
            return null;
        }

        $profile = $this->userProfileRepository->getAdressByUserId($userId);
        if (! $profile) {
            return null;
        }

        $address = $profile->address;

        // Normalize address: if stored as string convert to array under 'address' key
        if (is_string($address)) {
            $address = ['address' => $address];
        }

        // Build full profile payload for frontend (includes barcode, phone, pesel, etc.)
        $data = $profile->toArray();
        $data['address'] = is_array($address) ? $address : null;

        return $data;
    }


    public function checkProfileCompletion(int $userId): bool
    {
        $user = User::find($userId);
        if (!$user) {
            return false;
        }

        $isEducationComplete = $this->userProfileRepository->checkEducationCompletion($user);
        $isWorkTimeComplete = $this->userProfileRepository->checkWorkTimeCompletion($user);
        $isAddressComplete = $this->userProfileRepository->checkAddressCompletion($user);

        return $isEducationComplete && $isWorkTimeComplete && $isAddressComplete;
    }

    /**
     * Pobiera dane firmy na podstawie numeru NIP
     */
    public function getCompanyDataByNip(string $nip): array
    {
        return $this->nipService->fetchByNip($nip);
    }

    /**
     * Waliduje numer NIP
     */
    public function validateNip(string $nip): bool
    {
        return $this->nipService->validateNip($nip);
    }

    public function getUserProfileByUserId(?int $userId = null): ?array
    {
        $userId = $userId ?? Auth::id();
        if (! $userId) {
            return null;
        }

        $profile = $this->userProfileRepository->getAdressByUserId($userId);
        if (! $profile) {
            return null;
        }

        // zwracamy atrybuty modelu jako tablicę dla serwisów
        return $profile->toArray();
    }
}
