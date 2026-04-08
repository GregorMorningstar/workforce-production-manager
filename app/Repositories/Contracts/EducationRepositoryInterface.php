<?php

namespace App\Repositories\Contracts;

use App\Models\SchoolCertificate;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Enums\StatusAplication;

interface EducationRepositoryInterface
{
    public function findById(int $id): ?SchoolCertificate;

    public function getUserCertificates(User $user): Collection;

    public function getUserCertificatesPaginated(User $user, int $perPage = 4): \Illuminate\Contracts\Pagination\LengthAwarePaginator;

    public function create(array $data): SchoolCertificate;

    // return all certificates for given user id (by user -> user_profile relation)
    public function getAllByCurrentUserId(int $id): Collection;

    public function getAllPendingCertificates(int $perPage = 6, array $filters = []): LengthAwarePaginator;

    public function getMaximumEducationLevelForUser(int $userId): ?int;

    public function findByIdWithUser(int $id): ?SchoolCertificate;

    public function setStatusCertificate(SchoolCertificate $certificate, StatusAplication $status): SchoolCertificate;
}
