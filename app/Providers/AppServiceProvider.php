<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $bindings = [
            \App\Services\Contracts\UserServiceInterface::class => \App\Services\UserService::class,
            \App\Repositories\Contracts\UserRepositoryInterface::class => \App\Repositories\Eloquent\EloquentUserRepository::class,
            \App\Repositories\Contracts\DepartmentsRepositoryInterface::class => \App\Repositories\Eloquent\EloquentDepartmentsRepository::class,
            \App\Services\Contracts\DepartmentsServiceInterface::class => \App\Services\DepartmentsService::class,
            \App\Services\Contracts\FlagServiceInterface::class => \App\Services\FlagService::class,
            \App\Repositories\Contracts\FlagRepositoryInterface::class => \App\Repositories\Eloquent\EloquentFlagRepository::class,
            \App\Services\Contracts\MachinesServiceInterface::class => \App\Services\MachineService::class,
            \App\Repositories\Contracts\MachinesRepositoryInterface::class => \App\Repositories\Eloquent\EloquentMachinesRepository::class,
            \App\Services\Contracts\OperationMachineServiceInterface::class => \App\Services\OperationMachineService::class,
            \App\Repositories\Contracts\OperationMachineRepositoryInterface::class => \App\Repositories\Eloquent\EloquentOperationMachineRepository::class,
            \App\Services\Contracts\MachineFailureServiceInterface::class => \App\Services\MachineFailureService::class,
            \App\Repositories\Contracts\MachineFailureRepositoryInterface::class => \App\Repositories\Eloquent\EloquentMachineFailureRepository::class,
            \App\Services\Contracts\LeavesServiceInterface::class => \App\Services\LeavesService::class,
            \App\Repositories\Contracts\LeavesRepositoryInterface::class => \App\Repositories\Eloquent\EloquentLeavesRepository::class,
            \App\Services\Contracts\UserProfileServiceInterface::class => \App\Services\UserProfileService::class,
            \App\Repositories\Contracts\UserProfileRepositoryInterface::class => \App\Repositories\Eloquent\EloquentUserProfileRepository::class,
            \App\Services\Contracts\EducationServiceInterface::class => \App\Services\EducationService::class,
            \App\Repositories\Contracts\EducationRepositoryInterface::class => \App\Repositories\Eloquent\EloquentEducationRepository::class,
            \App\Services\Contracts\EmploymentCertificateServiceInterface::class => \App\Services\EmploymentCertificateService::class,
            \App\Repositories\Contracts\EmploymentCertificateRepositoryInterface::class => \App\Repositories\Eloquent\EloquentEmploymentCertificateRepository::class,
            \App\Services\Contracts\MachineFailureServiceInterface::class => \App\Services\MachineFailureService::class,
            \App\Repositories\Contracts\MachineFailureRepositoryInterface::class => \App\Repositories\Eloquent\EloquentMachineFailureRepository::class,
           \App\Services\Contracts\ProductionMaterialServiceInterface::class => \App\Services\ProductionMaterialService::class,
           \App\Repositories\Contracts\ProductionMaterialRepositoryInterface::class => \App\Repositories\Eloquent\EloquentProductionMaterialRepository::class,
            \App\Services\Contracts\ItemsFinishedGoodServiceInterface::class => \App\Services\ItemsFinishedGoodService::class,
            \App\Repositories\Contracts\ItemsFinishedGoodRepositoryInterface::class => \App\Repositories\Eloquent\EloquentItemsFinishedGoodRepository::class,
            \App\Services\Contracts\ProductionSchemaServiceInterface::class => \App\Services\ProductionSchemaService::class,
            \App\Repositories\Contracts\ProductionSchemaRepositoryInterface::class => \App\Repositories\Eloquent\EloquentProductionSchemaRepository::class,
            \App\Services\Contracts\ProductionSchemaStepServiceInterface::class => \App\Services\ProductionSchemaStepService::class,
            \App\Repositories\Contracts\ProductionSchemaStepRepositoryInterface::class => \App\Repositories\Eloquent\EloquentProductionSchemaStepRepository::class,
            \App\Services\Contracts\MachineFailureRepairServiceInterface::class => \App\Services\MachineFailureRepairService::class,
            \App\Repositories\Contracts\MachineFailureRepairRepositoryInterface::class => \App\Repositories\Eloquent\EloquentMachineFailureRepair::class,
            \App\Services\Contracts\OrderServiceInterface::class => \App\Services\OrderService::class,
            \App\Repositories\Contracts\OrderRepositoryInterface::class => \App\Repositories\Eloquent\EloquentOrderRepository::class,

            ];

        foreach ($bindings as $abstract => $concrete) {
            $this->app->bind($abstract, $concrete);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
