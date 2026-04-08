<?php

namespace App\Services;

use App\Services\Contracts\UserServiceInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Contracts\UserProfileRepositoryInterface;
use App\Services\Contracts\EmploymentCertificateServiceInterface;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class UserService implements UserServiceInterface
{
    private EmploymentCertificateServiceInterface $employmentCertificateService;

    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly UserProfileRepositoryInterface $userProfileRepository,
        EmploymentCertificateServiceInterface $employmentCertificateService
    ) {
        $this->employmentCertificateService = $employmentCertificateService;
    }

    public function getById(int $id): ?User
    {
        return $this->userRepository->findById($id);
    }

    public function getAll(int $perPage = 10): LengthAwarePaginator
    {
        return $this->userRepository->findAll($perPage);
    }

    public function getAllByRole(int $perPage = 10, ?string $role = null, array $filters = []): LengthAwarePaginator
    {
        return $this->userRepository->findAllByRole($perPage, $role, $filters);
    }
    public function getEmployeeDetailsWithRelations(int $employeeId): ?User
    {
        return $this->userRepository->getEmployeeDetailsWithRelations($employeeId);
    }

    public function createUserProfile(User $user, array $data): UserProfile
    {
        $validator = Validator::make($data, [
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:15',
            'pesel' => 'nullable|string|size:11',
            'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|in:M,F',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:15',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $profileData = $data;

        // Obsługa zdjęcia
        if (isset($data['profile_photo']) && $data['profile_photo'] instanceof UploadedFile) {
            $photoPath = $this->userProfileRepository->storeProfilePhoto($data['profile_photo'], $user);
            $profileData['profile_photo'] = $photoPath;
        }

        return $this->userProfileRepository->createProfile($user, $profileData);
    }

    public function updateUserProfile(User $user, array $data): UserProfile
    {
        $validator = Validator::make($data, [
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:15',
            'pesel' => 'nullable|string|size:11',
            'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|in:M,F',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:15',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $profile = $user->profile;

        if (!$profile) {
            return $this->createUserProfile($user, $data);
        }

        $profileData = $data;

        // Obsługa zdjęcia
        if (isset($data['profile_photo']) && $data['profile_photo'] instanceof UploadedFile) {
            $photoPath = $this->userProfileRepository->storeProfilePhoto($data['profile_photo'], $user);
            $profileData['profile_photo'] = $photoPath;
        }

        return $this->userProfileRepository->updateProfile($profile, $profileData);
    }

    public function getUserProfile(User $user): ?UserProfile
    {
        return $this->userProfileRepository->getProfile($user);
    }

    public function deleteUserProfile(User $user): bool
    {
        $profile = $user->profile;

        if (!$profile) {
            return false;
        }

        return $this->userProfileRepository->deleteProfile($profile);
    }

    public function deleteProfilePhoto(User $user): bool
    {
        $profile = $user->profile;

        if (!$profile || !$profile->profile_photo) {
            return false;
        }

        $deleted = $this->userProfileRepository->deleteProfilePhoto($profile->profile_photo);

        if ($deleted) {
            $profile->update(['profile_photo' => null]);
        }

        return $deleted;
    }

    public function getAllCertificatesWithPendingStatus(array $filters): ?LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 6);

        return $this->employmentCertificateService->getAllCertificatesWithPendingStatus($perPage, $filters);
    }

    public function setWorkedMonths(int $userId, int $months): ?User
    {
       return $this->userRepository->setWorkedMonths($userId, $months);
    }

    public function getAnnualLeaveDays(int $userId): ?User
    {
        return $this->userRepository->getAnnualLeaveDays($userId);
    }
}
