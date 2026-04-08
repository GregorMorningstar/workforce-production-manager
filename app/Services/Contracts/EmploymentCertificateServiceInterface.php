<?php

namespace App\Services\Contracts;
use App\Models\EmploymentCertificate;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Enums\StatusAplication;
use Illuminate\Database\Eloquent\Collection;

interface EmploymentCertificateServiceInterface
{
	public function employeeCreateCertificate(array $data): ?EmploymentCertificate;
    public function getCertificatesByUserId(int $userId): ?Collection;
    public function getAllCertificatesWithPendingStatus(int $perPage = 6, array $filters = []) : ?LengthAwarePaginator;
    public  function setStatusCertificate(EmploymentCertificate $certificate, StatusAplication $status): EmploymentCertificate;
    public function calculateTenureInMonths(EmploymentCertificate $certificate): int;
    }
