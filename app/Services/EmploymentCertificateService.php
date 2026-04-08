<?php

namespace App\Services;

use App\Services\Contracts\EmploymentCertificateServiceInterface;
use App\Repositories\Contracts\EmploymentCertificateRepositoryInterface;
use App\Models\EmploymentCertificate;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Enums\StatusAplication;

class EmploymentCertificateService implements EmploymentCertificateServiceInterface
{
    public function __construct(private readonly EmploymentCertificateRepositoryInterface $repository)
    {
    }

    public function employeeCreateCertificate(array $data): ?EmploymentCertificate
    {
        return $this->repository->employeeCreateCertificate($data);
    }

    public function getCertificatesByUserId(int $userId): ?\Illuminate\Database\Eloquent\Collection
    {
        return $this->repository->getCertificatesByUserId($userId);
    }


    public function getAllCertificatesWithPendingStatus(int $perPage = 6, array $filters = []) : ?LengthAwarePaginator
    {
        return $this->repository->getAllCertificatesWithPendingStatus($perPage, $filters);
    }

    public function setStatusCertificate(EmploymentCertificate $certificate, StatusAplication $status): EmploymentCertificate
    {
        $certificate->status = $status->value;
        $certificate->save();
        return $certificate;
    }

    public function calculateTenureInMonths(EmploymentCertificate $certificate): int
    {


        return $this->repository->calculateTenureInMonths($certificate);
    }

}
