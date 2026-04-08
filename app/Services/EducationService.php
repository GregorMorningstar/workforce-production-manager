<?php

namespace App\Services;

use App\Models\SchoolCertificate;
use App\Models\User;
use App\Services\Contracts\EducationServiceInterface;
use App\Repositories\Contracts\EducationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Enums\StatusAplication;

class EducationService implements EducationServiceInterface
{
    public function __construct(
        private readonly EducationRepositoryInterface $educationRepository
    ) {
    }

    public function createSchoolCertificate(User $user, array $data): SchoolCertificate
    {
        $payload = [
            'user_id'          => $user->id,
            'school_name'      => $data['schoolName'] ?? null,
            'school_address'   => $data['schoolAddress'] ?? null,
            'start_year'       => $data['startYear'] ?? null,
            'end_year'         => $data['endYear'] ?? null,
            'education_level'  => $data['degree'] ?? null,
            'certificate_path' => $data['certificate_path'] ?? null,
        ];

        return $this->educationRepository->create($payload);
    }

    public function getSchoolCertificateById(int $id): ?SchoolCertificate
    {
        return $this->educationRepository->findById($id);
    }

    // helper used by controller
    public function getLatestCertificateForUser(User $user): ?SchoolCertificate
    {
        $collection = $this->educationRepository->getUserCertificates($user);
        return $collection->first();
    }

    // get paginated certificates for user
    public function getPaginatedCertificatesForUser(User $user, int $perPage = 4): LengthAwarePaginator
    {
        return $this->educationRepository->getUserCertificatesPaginated($user, $perPage);
    }
//get all recort pending certificates
    public function getAllPendingCertificates(array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 6);

        return $this->educationRepository->getAllPendingCertificates($perPage, $filters);
    }

    public function getMaximumEducationLevelForUser(int $userId): ?int
    {
        return $this->educationRepository->getMaximumEducationLevelForUser($userId);
    }

    public function getCertificateWithUserById(int $id): ?SchoolCertificate
    {
        return $this->educationRepository->findByIdWithUser($id);
    }

    public function setStatusCertificate(SchoolCertificate $certificate, StatusAplication $status): SchoolCertificate
    {
        return $this->educationRepository->setStatusCertificate($certificate, $status);
    }
}
