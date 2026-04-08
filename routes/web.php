<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Broadcast;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\ModeratorController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\DepartamentsController;
use App\Http\Controllers\MachinesController;
use App\Http\Controllers\MachineOperationController;
use App\Http\Controllers\MachineFailuresController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\EmployeeDetailsController;
use App\Http\Controller\UserProfileController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\MachineFailureRepairController;
use App\Http\Controllers\ProductionMaterialController;
use App\Http\Controllers\ProductionPlanController;
use App\Http\Controllers\ItemsFinishedGoodController;
use App\Http\Controllers\ProductionSchemaController;
use App\Http\Controllers\OrderController;

// Broadcasting authentication routes
Broadcast::routes(['middleware' => ['web', 'auth']]);

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');
// URL: /

/* =================== MODERATOR ROUTES =================== */
Route::middleware(['web', 'auth', 'verified', 'role:moderator'])
    ->prefix('moderator')
    ->name('moderator.')
    ->group(function () {
        // Dashboard
        Route::get('/dashboard', [ModeratorController::class, 'dashboard'])->name('dashboard');
        // URL: /moderator/dashboard

        // Machines
        Route::prefix('machines')->name('machines.')->group(function () {
            Route::get('/', [MachinesController::class, 'moderatorIndex'])->name('index');
            // URL: /moderator/machines
            Route::get('/add-new', [MachinesController::class, 'create'])->name('create');
            // URL: /moderator/machines/add-new
            Route::post('/add-new', [MachinesController::class, 'store'])->name('store');
            // URL: /moderator/machines/add-new (POST)
            Route::get('/{id}/edit', [MachinesController::class, 'edit'])->name('edit');
            // URL: /moderator/machines/{id}/edit
            Route::put('/{id}', [MachinesController::class, 'update'])->name('update');
            // URL: /moderator/machines/{id} (PUT)
            Route::delete('/{id}', [MachinesController::class, 'destroy'])->name('destroy');
            // URL: /moderator/machines/{id} (DELETE)

            // Machine operations
            Route::prefix('operations')->name('operations.')->group(function () {
                Route::get('/', [MachineOperationController::class, 'getAllOperations'])->name('index');
                // URL: /moderator/machines/operations
                Route::post('/quick-store', [MachineOperationController::class, 'quickStore'])->name('quick_store');
                // URL: /moderator/machines/operations/quick-store (POST)
                Route::get('/{machine_id}/add', [MachineOperationController::class, 'createOperation'])->name('create');
                // URL: /moderator/machines/operations/{machine_id}/add
                Route::post('/{machine_id}', [MachineOperationController::class, 'storeOperation'])->name('store');
                // URL: /moderator/machines/operations/{machine_id} (POST)
                Route::get('/{operation_id}/show', [MachineOperationController::class, 'showOperation'])->name('show');
                // URL: /moderator/machines/operations/{operation_id}/show
                Route::get('/{operation_id}/edit', [MachineOperationController::class, 'editOperation'])->name('edit');
                // URL: /moderator/machines/operations/{operation_id}/edit
                Route::put('/{operation_id}', [MachineOperationController::class, 'updateOperation'])->name('update');
                // URL: /moderator/machines/operations/{operation_id} (PUT)
                Route::delete('/{operation_id}', [MachineOperationController::class, 'destroyOperation'])->name('destroy');
                // URL: /moderator/machines/operations/{operation_id} (DELETE)
            });
        });

        // Users
        Route::prefix('users')->group(function () {
            Route::get('/', [UserController::class, 'index'])->name('users.index');
            // URL: /moderator/users
            Route::get('/confirmation-education', [UserController::class, 'confirmationEducation'])->name('users.confirmation-education');
            // URL: /moderator/users/confirmation-education
            Route::post('/education/approve', [UserController::class, 'approveEducation'])->name('users.approve-education');
            // URL: /moderator/users/education/approve (POST)
            Route::post('/education/reject', [UserController::class, 'rejectEducation'])->name('users.reject-education');
            // URL: /moderator/users/education/reject (POST)
            Route::get('/confirmation-work-certificates', [UserController::class, 'confirmationWorkCertificates'])->name('users.confirmation-work-certificates');
            // URL: /moderator/users/confirmation-work-certificates
            Route::post('/work-certificates/approve', [UserController::class, 'approveWorkCertificate'])->name('users.approve-work-certificates');
            // URL: /moderator/users/work-certificates/approve (POST)
            Route::post('/work-certificates/reject', [UserController::class, 'rejectWorkCertificate'])->name('users.reject-work-certificates');
            // URL: /moderator/users/work-certificates/reject (POST)
            Route::get('/{id}', [UserController::class, 'show'])->name('users.show');
            // URL: /moderator/users/{id}
        });

        // Leaves
        Route::prefix('leaves')->name('leaves.')->group(function () {
            Route::get('/', [ModeratorController::class, 'getLeavesCalendar'])->name('calendar');
            // URL: /moderator/leaves
            Route::get('/pending', [ModeratorController::class, 'getPendingLeaves'])->name('pending');
            // URL: /moderator/leaves/pending
            Route::get('/pending/{userId}', [ModeratorController::class, 'getUserPendingLeaves'])->name('pending.user');
            // URL: /moderator/leaves/pending/{userId}
            Route::post('/approve', [ModeratorController::class, 'approveLeave'])->name('approve');
            // URL: /moderator/leaves/approve (POST)
            Route::post('/reject', [ModeratorController::class, 'rejectLeave'])->name('reject');
            // URL: /moderator/leaves/reject (POST)
        });

        // Departments
        Route::prefix('departments')->group(function () {
            Route::get('/', [DepartamentsController::class, 'moderatorIndex'])->name('departments.index');
            // URL: /moderator/departments
            Route::get('/add-new', [DepartamentsController::class, 'create'])->name('departments.create');
            // URL: /moderator/departments/add-new
            Route::post('/add-new', [DepartamentsController::class, 'store'])->name('departments.store');
            // URL: /moderator/departments/add-new (POST)
            Route::get('/{id}/edit', [DepartamentsController::class, 'edit'])->whereNumber('id')->name('departments.edit');
            // URL: /moderator/departments/{id}/edit
            Route::get('/{id}/hall-preview', [DepartamentsController::class, 'hallPreview'])->whereNumber('id')->name('departments.hall_preview');
            // URL: /moderator/departments/{id}/hall-preview
            Route::post('/{id}/hall-layout', [DepartamentsController::class, 'saveHallLayout'])->whereNumber('id')->name('departments.hall_layout.save');
            // URL: /moderator/departments/{id}/hall-layout (POST)
            Route::put('/{id}', [DepartamentsController::class, 'update'])->whereNumber('id')->name('departments.update');
            // URL: /moderator/departments/{id} (PUT)
            Route::delete('/{id}', [DepartamentsController::class, 'destroy'])->whereNumber('id')->name('departments.destroy');
            // URL: /moderator/departments/{id} (DELETE)
            Route::get('/{id}', [DepartamentsController::class, 'show'])->whereNumber('id')->name('departments.show');
            // URL: /moderator/departments/{id}
        });

        // Production materials
        Route::prefix('production-materials')->name('production_materials.')->group(function () {
            Route::get('/', [ProductionMaterialController::class, 'index'])->name('index');
            // URL: /moderator/production-materials
            Route::get('/create', [ProductionMaterialController::class, 'create'])->name('create');
            // URL: /moderator/production-materials/create
            Route::post('/', [ProductionMaterialController::class, 'store'])->name('store');
            // URL: /moderator/production-materials (POST)
            Route::post('/quick-store', [ProductionMaterialController::class, 'quickStore'])->name('quick_store');
            // URL: /moderator/production-materials/quick-store (POST)
            Route::get('/all-history', [ProductionMaterialController::class, 'allHistory'])->name('all_history');
            // URL: /moderator/production-materials/all-history
            Route::post('/{id}/add', [ProductionMaterialController::class, 'addQuantity'])->name('add');
            // URL: /moderator/production-materials/{id}/add (POST)
            Route::post('/{id}/subtract', [ProductionMaterialController::class, 'subtractQuantity'])->name('subtract');
            // URL: /moderator/production-materials/{id}/subtract (POST)
            Route::get('/{id}/history', [ProductionMaterialController::class, 'history'])->name('history');
            // URL: /moderator/production-materials/{id}/history
        });

        // Production schemas
        Route::get('/production-schemas', [ProductionSchemaController::class, 'index'])->name('production_schemas.index');
        // URL: /moderator/production-schemas

        // Production planning
        Route::prefix('production')->name('production.')->group(function () {
            Route::prefix('planning')->name('planning.')->group(function () {
                Route::get('/', [ProductionPlanController::class, 'index'])->name('index');
                // URL: /moderator/production/planning
                Route::get('/orders/{orderId}/schema', [ProductionPlanController::class, 'orderSchema'])->name('order_schema');
                // URL: /moderator/production/planning/orders/{orderId}/schema
                Route::post('/orders/{orderId}/assign-operators', [ProductionPlanController::class, 'assignOperators'])->name('assign_operators');
                // URL: /moderator/production/planning/orders/{orderId}/assign-operators (POST)
                Route::prefix('processes')->group(function () {
                    Route::get('/', [ProductionPlanController::class, 'processes'])->name('processes');
                    // URL: /moderator/production/planning/processes
                });
            });
        });

        // Items and production-schema nested routes
        Route::prefix('items')->name('items.')->group(function () {
            Route::get('/', [ItemsFinishedGoodController::class, 'index'])->name('index');
            // URL: /moderator/items
            Route::get('/create', [ItemsFinishedGoodController::class, 'create'])->name('create');
            // URL: /moderator/items/create
            Route::get('/processes', [ItemsFinishedGoodController::class, 'processes'])->name('processes');
            // URL: /moderator/items/processes
            Route::post('/', [ItemsFinishedGoodController::class, 'store'])->name('store');
            // URL: /moderator/items (POST)
            Route::get('/{id}', [ItemsFinishedGoodController::class, 'show'])->whereNumber('id')->name('show');
            // URL: /moderator/items/{id}
            Route::get('/{id}/edit', [ItemsFinishedGoodController::class, 'edit'])->whereNumber('id')->name('edit');
            // URL: /moderator/items/{id}/edit
            Route::put('/{id}', [ItemsFinishedGoodController::class, 'update'])->whereNumber('id')->name('update');
            // URL: /moderator/items/{id} (PUT)
            Route::delete('/{id}', [ItemsFinishedGoodController::class, 'destroy'])->whereNumber('id')->name('destroy');
            // URL: /moderator/items/{id} (DELETE)

            Route::prefix('/production-schema')->name('production_schema.')->group(function () {
                Route::get('/get-all', [ProductionSchemaController::class, 'getAll'])->name('get_all');
                // URL: /moderator/items/production-schema/get-all
                Route::get('/{item_id}', [ProductionSchemaController::class, 'showByItem'])->name('show');
                // URL: /moderator/items/production-schema/{item_id}
                Route::get('/{item_id}/create-step', [ProductionSchemaController::class, 'createStep'])->name('create_step');
                // URL: /moderator/items/production-schema/{item_id}/create-step
                Route::post('/{item_id}/create-step', [ProductionSchemaController::class, 'storeStep'])->name('store_step');
                // URL: /moderator/items/production-schema/{item_id}/create-step (POST)
                Route::get('/step/{step_id}/edit', [ProductionSchemaController::class, 'editStep'])->name('edit_step');
                // URL: /moderator/items/production-schema/step/{step_id}/edit
                Route::put('/step/{step_id}', [ProductionSchemaController::class, 'updateStep'])->name('update_step');
                // URL: /moderator/items/production-schema/step/{step_id} (PUT)
                Route::delete('/step/{step_id}', [ProductionSchemaController::class, 'destroyStep'])->name('destroy_step');
                // URL: /moderator/items/production-schema/step/{step_id} (DELETE)
                Route::post('/{item_id}/reorder-steps', [ProductionSchemaController::class, 'reorderSteps'])->name('reorder_steps');
                // URL: /moderator/items/production-schema/{item_id}/reorder-steps (POST)
            });
        });

        // Orders
        Route::prefix('orders')->name('orders.')->group(function () {
            Route::get('/', [OrderController::class, 'index'])->name('index');
            // URL: /moderator/orders
            Route::get('/create', [OrderController::class, 'create'])->name('create');
            // URL: /moderator/orders/create
            Route::post('/', [OrderController::class, 'store'])->name('store');
            // URL: /moderator/orders (POST)
            Route::get('/{id}', [OrderController::class, 'show'])->name('show');
            // URL: /moderator/orders/{id}
            Route::get('/{id}/add-item', [OrderController::class, 'addItem'])->name('add_item');
            // URL: /moderator/orders/{id}/add-item
            Route::post('/{id}/add-item', [OrderController::class, 'storeItems'])->name('store_items');
            // URL: /moderator/orders/{id}/add-item (POST)
            Route::post('/{id}/reject', [OrderController::class, 'reject'])->name('reject');
            // URL: /moderator/orders/{id}/reject (POST)
            Route::delete('/{id}', [OrderController::class, 'destroy'])->name('destroy');
            // URL: /moderator/orders/{id} (DELETE)
            Route::get('/sold-items', [OrderController::class, 'soldItems'])->name('sold_items');
            // URL: /moderator/orders/sold-items
        });
    });

/* =================== EMPLOYEE ROUTES =================== */
Route::middleware(['web', 'auth', 'verified', 'role:employee'])
    ->prefix('employee')
    ->name('employee.')
    ->group(function () {
        Route::prefix('dashboard')->name('dashboard.')->group(function () {
            Route::get('/', [EmployeeController::class, 'index'])->name('index');
            // URL: /employee/dashboard
        });

        // Employee calendar routes
        Route::prefix('calendar')->name('calendar.')->group(function () {
            Route::get('/', [CalendarController::class, 'index'])->name('index');
            // URL: /employee/calendar
            Route::post('/store', [CalendarController::class, 'store'])->name('store');
            // URL: /employee/calendar/store (POST)
            Route::get('/show/{id}', [CalendarController::class, 'show'])->name('show');
            // URL: /employee/calendar/show/{id}
            Route::get('/edit/{id}', [CalendarController::class, 'edit'])->name('edit');
            // URL: /employee/calendar/edit/{id}
            Route::put('/update/{id}', [CalendarController::class, 'update'])->name('update');
            // URL: /employee/calendar/update/{id} (PUT)
            Route::get('/history', [CalendarController::class, 'history'])->name('history');
            // URL: /employee/calendar/history
            Route::get('/details/{id}', [CalendarController::class, 'detailsLeavesById'])->name('details');
            // URL: /employee/calendar/details/{id}
        });

        // Employee production
        Route::prefix('production')->name('production.')->group(function () {
            Route::get('/my', [EmployeeController::class, 'myProduction'])->name('my');
            // URL: /employee/production/my
            Route::get('/history', [EmployeeController::class, 'productionHistory'])->name('history');
            // URL: /employee/production/history
            Route::get('/{planId}/machine-operations', [EmployeeController::class, 'machineOperationsForPlan'])->name('machine_operations');
            // URL: /employee/production/{planId}/machine-operations
            Route::post('/{planId}/start', [EmployeeController::class, 'startProduction'])->name('start');
            // URL: /employee/production/{planId}/start
            Route::get('/{planId}/workbench', [EmployeeController::class, 'productionWorkbench'])->name('workbench');
            // URL: /employee/production/{planId}/workbench
            Route::post('/{planId}/changeover/start', [EmployeeController::class, 'startMachineChangeover'])->name('changeover_start');
            // URL: /employee/production/{planId}/changeover/start
            Route::post('/{planId}/changeover/end', [EmployeeController::class, 'endMachineChangeover'])->name('changeover_end');
            // URL: /employee/production/{planId}/changeover/end
            Route::post('/{planId}/task/start', [EmployeeController::class, 'startTaskByBarcode'])->name('task_start');
            // URL: /employee/production/{planId}/task/start
            Route::post('/{planId}/task/finish', [EmployeeController::class, 'finishTaskByMachineScan'])->name('task_finish');
            // URL: /employee/production/{planId}/task/finish
        });

        // Employee profile
        Route::prefix('profile')->name('profile.')->group(function () {
            Route::get('/', [EmployeeController::class, 'showEmployeeProfile'])->name('show');
            // URL: /employee/profile
        });

        // Employee address
        Route::prefix('adress')->name('address.')->group(function () {
            Route::get('/', [EmployeeController::class, 'showAddress'])->name('show');
            // URL: /employee/adress
            Route::get('/create', [EmployeeController::class, 'createAddress'])->name('create');
            // URL: /employee/adress/create
            Route::get('/edit', [EmployeeController::class, 'editAddress'])->name('edit');
            // URL: /employee/adress/edit
            Route::post('/', [EmployeeController::class, 'storeAddress'])->name('store');
            // URL: /employee/adress (POST)
            Route::put('/update', [EmployeeController::class, 'updateAddress'])->name('update');
            // URL: /employee/adress/update (PUT)
        });

        // Employee company
        Route::prefix('company')->name('company.')->group(function () {
            Route::get('/', [EmployeeController::class, 'showCompany'])->name('show');
            // URL: /employee/company
            Route::get('/create', [EmployeeController::class, 'createCompany'])->name('create');
            // URL: /employee/company/create
            Route::get('/edit', [EmployeeController::class, 'editCompany'])->name('edit');
            // URL: /employee/company/edit
            Route::post('/', [EmployeeController::class, 'storeCompany'])->name('store');
            // URL: /employee/company (POST)
            Route::put('/update', [EmployeeController::class, 'updateCompany'])->name('update');
            // URL: /employee/company/update (PUT)
        });

        // Employee education
        Route::prefix('education')->name('education.')->group(function () {
            Route::get('/', [EmployeeController::class, 'showEducation'])->name('index');
            // URL: /employee/education
            Route::get('/create', [EmployeeController::class, 'createEducation'])->name('create');
            // URL: /employee/education/create
            Route::get('/{id}/edit', [EmployeeController::class, 'editEducation'])->name('edit');
            // URL: /employee/education/{id}/edit
            Route::post('/', [EmployeeController::class, 'storeEducation'])->name('store');
            // URL: /employee/education (POST)
            Route::put('/{id}', [EmployeeController::class, 'updateEducation'])->name('update');
            // URL: /employee/education/{id} (PUT)
            Route::delete('/{id}', [EmployeeController::class, 'destroyEducation'])->name('destroy');
            // URL: /employee/education/{id} (DELETE)
            Route::get('/all', [EmployeeController::class, 'showEducationDetails'])->name('show');
            // URL: /employee/education/all
        });
    });

/* =================== ADMIN ROUTES =================== */

Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');
        Route::prefix('items')->name('items.')->group(function () {
            Route::get('/processes', [ItemsFinishedGoodController::class, 'processes'])->name('processes');
            // URL: /admin/items/processes
        });
    });

/* =================== SHARED AUTHENTICATED ROUTES =================== */
Route::middleware('auth')->group(function () {
    Route::get('/chat', [ChatController::class, 'index'])->name('chat.index');
    // URL: /chat
    Route::post('/chat', [ChatController::class, 'store'])->name('chat.store');
    // URL: /chat (POST)
    Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');
    // URL: /orders (POST)

    // Machine Failures Reporting
    Route::prefix('machines')->name('machines.')->group(function () {
        Route::get('/report-failure', [MachineFailuresController::class, 'index'])->name('report-failure');
        // URL: /machines/report-failure
        Route::get('user/', [MachinesController::class, 'getUserMachines'])->name('user.machines');
        // URL: /machines/user

        Route::prefix('/failures')->name('failures.')->group(function () {
            // JSON endpoint: repairs for a specific machine_failure (used by modal)
            Route::get('/{id}/repairs', [MachineFailureRepairController::class, 'listByFailure'])->name('repairs.by_failure');
            // URL: /machines/failures/{id}/repairs
            Route::get('/add-new/{machine_id}', [MachineFailuresController::class, 'create'])->name('create');
            // URL: /machines/failures/add-new/{machine_id}
            Route::get('/fix', [MachineFailureRepairController::class, 'createRaportedFailure'])->name('repairs.create');
            // URL: /machines/failures/fix
            Route::get('fix/list', [MachineFailuresController::class, 'repariedList'])->name('repairs.reparied.list');
            // URL: /machines/failures/fix/list
            Route::get('/fix/{id}', [MachineFailureRepairController::class, 'createRaportedFailureNextStep'])->name('repairs.create.nextstep');
            // URL: /machines/failures/fix/{id}
            Route::delete('/fix/{id}', [MachineFailureRepairController::class, 'destroy'])->name('repairs.destroy');
            // URL: /machines/failures/fix/{id} (DELETE)
            Route::put('/fix/{id}', [MachineFailureRepairController::class, 'update'])->name('repairs.update');
            // URL: /machines/failures/fix/{id} (PUT)
            Route::post('/repairs', [MachineFailureRepairController::class, 'store'])->name('repairs.store');
            // URL: /machines/failures/repairs (POST)
            // Repair actions (add/edit/delete) - restricted to moderator for mutating operations
            Route::get('/repairs/{id}/actions', [MachineFailureRepairController::class, 'listActions'])->name('repairs.actions.list');
            // URL: /machines/failures/repairs/{id}/actions
            Route::post('/repairs/{id}/actions', [MachineFailureRepairController::class, 'storeAction'])->name('repairs.actions.store')->middleware('role:moderator');
            // URL: /machines/failures/repairs/{id}/actions (POST)
            Route::put('/repairs/{id}/actions/{actionId}', [MachineFailureRepairController::class, 'updateAction'])->name('repairs.actions.update')->middleware('role:moderator');
            // URL: /machines/failures/repairs/{id}/actions/{actionId} (PUT)
            Route::delete('/repairs/{id}/actions/{actionId}', [MachineFailureRepairController::class, 'destroyAction'])->name('repairs.actions.destroy')->middleware('role:moderator');
            // URL: /machines/failures/repairs/{id}/actions/{actionId} (DELETE)
            Route::post('/', [MachineFailuresController::class, 'store'])->name('store');
            // URL: /machines/failures (POST)
            // Repaired failures history (finished_repaired_at NOT NULL)
            Route::get('/repairs/history', [MachineFailuresController::class, 'repairsHistory'])->name('repairs.history.index');
            // URL: /machines/failures/repairs/history
            Route::prefix('/history')->name('history.')->group(function () {
                Route::get('/', [MachineFailuresController::class, 'history'])->name('index');
                // URL: /machines/failures/history
            });
            Route::prefix('edit')->name('edit.')->group(function () {
                Route::get('/{id}', [MachineFailuresController::class, 'edit'])->name('index');
                // URL: /machines/failures/edit/{id}
                Route::put('/{id}', [MachineFailuresController::class, 'update'])->name('update');
                // URL: /machines/failures/{id} (PUT)
            });
            Route::delete('/{id}', [MachineFailuresController::class, 'destroy'])->name('destroy');
            // URL: /machines/failures/{id} (DELETE)
        });
    });
});

// Authenticated user dashboard
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    // URL: /dashboard
});

Route::fallback(function () {
    $user = Auth::user();

    $routeName = $user
        ? match ($user->role) {
            'admin'     => 'admin.dashboard',
            'moderator' => 'moderator.dashboard',
            'employee'  => 'employee.dashboard.index',
            default     => 'dashboard',
        }
        : 'home';

    $targetUrl = route($routeName);

    return response()->view('errors.404-redirect', [
        'targetUrl' => $targetUrl,
        'seconds'   => 5,
        'role'      => $user?->role,
    ], 404);
});
// API routes
Route::prefix('api')->middleware(['web', 'auth'])->group(function () {
    Route::get('/company/nip-lookup/{nip}', [App\Http\Controllers\Api\CompanyController::class, 'nipLookup']);
    // URL: /api/company/nip-lookup/{nip}
    Route::get('/schools/search', [App\Http\Controllers\Api\SchoolController::class, 'searchSchools']);
    // URL: /api/schools/search
});

require __DIR__.'/settings.php';
