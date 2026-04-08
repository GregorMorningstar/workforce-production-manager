<?php

namespace App\Services;

use App\Repositories\Contracts\DepartmentsRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Models\Department;
use App\Services\Contracts\DepartmentServiceInterface;

class DepartmentsService implements DepartmentServiceInterface
{
  public function __construct(private readonly DepartmentsRepositoryInterface $departmentsRepository) {}



         public function getAllDepartmentsWithUsersPaginated(int $perPage): LengthAwarePaginator
         {
              return $this->departmentsRepository->getAllWithUsersPaginated($perPage);
         }

         public function existsByName(string $name): bool
         {
              return $this->departmentsRepository->existsByName($name);
         }

         public function createDepartment(array $data): Department
         {
              return $this->departmentsRepository->create($data);
         }
         public function getById(int $id): ?Department
         {
              return $this->departmentsRepository->findById($id);
         }

         public function updateDepartment(int $id, array $data): Department
         {
              return $this->departmentsRepository->update($id, $data);
         }

         public function deleteDepartment(int $id): bool
         {
              return $this->departmentsRepository->delete($id);
         }

            public function getByIdWithUsersAndMachines(int $id): ?Department
            {
                return $this->departmentsRepository->findByIdWithUsersAndMachines($id);
            }

               public function saveHallLayout(int $id, array $layout): bool
               {
                    return $this->departmentsRepository->updateHallLayout($id, $layout);
               }
}
