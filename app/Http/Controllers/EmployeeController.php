<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Enums\OrderItemProductionPlanStatus;
use App\Enums\LeavesStatus;
use App\Enums\LeavesType;
use App\Models\LeaveBalance;
use App\Models\Leaves;
use App\Models\Machines;
use App\Models\OrderItemProductionEvent;
use App\Models\OrderItemProductionPlan;
use Illuminate\Support\Carbon;
use App\Services\Contracts\UserServiceInterface;
use App\Services\Contracts\EducationServiceInterface;
use App\Services\Contracts\UserProfileServiceInterface;
use App\Repositories\Contracts\FlagRepositoryInterface;
use App\Services\Contracts\EmploymentCertificateServiceInterface;
use Inertia\Inertia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;

class EmployeeController extends Controller
{
    public function __construct(
        private readonly UserServiceInterface $userService,
        private readonly UserProfileServiceInterface $userProfileService,
        private readonly FlagRepositoryInterface $flagRepository,
        private readonly EducationServiceInterface $educationService,
        private readonly EmploymentCertificateServiceInterface $employmentCertificateService
    ) {}

    public function index()
    {
        // poprawione wywołanie repozytorium (bez parametru, repo korzysta z Auth::id())
        $userFlagByAddress = $this->flagRepository->addressFlagsByUser();

        $userId = Auth::id();
        $year = now()->year;

        $leaveBalance = LeaveBalance::query()
            ->where('user_id', $userId)
            ->where('year', $year)
            ->latest('id')
            ->first();

        $leaveHistory = Leaves::query()
            ->where('user_id', $userId)
            ->orderByDesc('start_date')
            ->limit(5)
            ->get([
                'id',
                'start_date',
                'end_date',
                'type',
                'status',
                'description',
            ])
            ->map(function (Leaves $leave) {
                $statusEnum = LeavesStatus::tryFrom((string) $leave->status);
                $typeEnum = LeavesType::fromDatabase((string) $leave->type);

                return [
                    'id' => $leave->id,
                    'start_date' => (string) $leave->start_date,
                    'end_date' => (string) $leave->end_date,
                    'type' => $typeEnum?->label() ?? (string) $leave->type,
                    'status' => $statusEnum?->label() ?? (string) $leave->status,
                    'description' => $leave->description,
                ];
            })
            ->values();

        $leaveCalendarEvents = Leaves::query()
            ->where('user_id', $userId)
            ->orderByDesc('start_date')
            ->get([
                'id',
                'start_date',
                'end_date',
                'type',
                'status',
                'description',
            ])
            ->map(function (Leaves $leave) {
                $statusEnum = LeavesStatus::tryFrom((string) $leave->status);
                $typeEnum = LeavesType::fromDatabase((string) $leave->type);

                return [
                    'id' => $leave->id,
                    'start_date' => (string) $leave->start_date,
                    'end_date' => (string) $leave->end_date,
                    'type' => (string) $leave->type,
                    'type_label' => $typeEnum?->label() ?? (string) $leave->type,
                    'status' => (string) $leave->status,
                    'status_label' => $statusEnum?->label() ?? (string) $leave->status,
                    'description' => $leave->description,
                ];
            })
            ->values();

        $assignedMachineIds = OrderItemProductionPlan::query()
            ->where('assigned_user_id', $userId)
            ->whereNotNull('machine_id')
            ->distinct()
            ->pluck('machine_id')
            ->filter()
            ->values();

        $assignedMachines = Machines::query()
            ->with('department:id,name')
            ->whereIn('id', $assignedMachineIds)
            ->get(['id', 'name', 'barcode', 'department_id']);

        $totalAssignedPlans = OrderItemProductionPlan::query()
            ->where('assigned_user_id', $userId)
            ->count();

        $completedPlans = OrderItemProductionPlan::query()
            ->where('assigned_user_id', $userId)
            ->where('status', OrderItemProductionPlanStatus::ZAKONCZONO_PROCES->value)
            ->count();

        $inProgressPlans = OrderItemProductionPlan::query()
            ->where('assigned_user_id', $userId)
            ->where('status', OrderItemProductionPlanStatus::ROZPOCZETO_PROCES->value)
            ->count();

        $pendingLeaveRequests = Leaves::query()
            ->where('user_id', $userId)
            ->where('status', LeavesStatus::PENDING->value)
            ->count();

        $employeeEfficiency = $totalAssignedPlans > 0
            ? round(($completedPlans / $totalAssignedPlans) * 100, 2)
            : 0.0;

        $efficiencyDetails = OrderItemProductionPlan::query()
            ->with([
                'operation:id,operation_name',
                'machine:id,name',
            ])
            ->where('assigned_user_id', $userId)
            ->where('status', OrderItemProductionPlanStatus::ZAKONCZONO_PROCES->value)
            ->orderByDesc('planned_end_at')
            ->orderByDesc('id')
            ->limit(12)
            ->get([
                'id',
                'operationmachine_id',
                'machine_id',
                'planned_start_at',
                'planned_end_at',
                'notes',
            ])
            ->map(function (OrderItemProductionPlan $plan) {
                $notes = is_string($plan->notes) ? json_decode($plan->notes, true) : [];
                if (!is_array($notes)) {
                    $notes = [];
                }

                $normSeconds = (int) ($notes['norm_required_seconds'] ?? 0);
                $normMinutes = $normSeconds > 0 ? round($normSeconds / 60, 2) : 0;

                return [
                    'id' => $plan->id,
                    'process' => $plan->operation?->operation_name ?? '-',
                    'machine' => $plan->machine?->name ?? '-',
                    'started_at' => optional($plan->planned_start_at)?->format('Y-m-d H:i:s'),
                    'finished_at' => optional($plan->planned_end_at)?->format('Y-m-d H:i:s'),
                    'norm_seconds' => $normSeconds,
                    'norm_minutes' => $normMinutes,
                    'performance_percent' => isset($notes['norm_performance_percent'])
                        ? (float) $notes['norm_performance_percent']
                        : null,
                ];
            })
            ->values();

        $avgNormPerformance = round(
            (float) $efficiencyDetails
                ->pluck('performance_percent')
                ->filter(fn ($v) => $v !== null)
                ->avg(),
            2
        );

        return Inertia::render('employee/dashboard/index', [
            'addressFlags' => $userFlagByAddress,
            'leaveSummary' => [
                'year' => $year,
                'entitlementDays' => (int) ($leaveBalance?->entitlement_days ?? 0),
                'usedDays' => (int) ($leaveBalance?->used_days ?? 0),
                'remainingDays' => (int) ($leaveBalance?->remaining_days ?? 0),
                'pendingRequests' => $pendingLeaveRequests,
            ],
            'leaveHistory' => $leaveHistory,
            'leaveCalendarEvents' => $leaveCalendarEvents,
            'employeeStats' => [
                'totalAssignedPlans' => $totalAssignedPlans,
                'completedPlans' => $completedPlans,
                'inProgressPlans' => $inProgressPlans,
                'efficiencyRate' => $employeeEfficiency,
                'avgNormPerformance' => $avgNormPerformance,
            ],
            'efficiencyDetails' => $efficiencyDetails,
            'assignedMachines' => $assignedMachines->map(fn ($machine) => [
                'id' => $machine->id,
                'name' => $machine->name,
                'barcode' => $machine->barcode,
                'department' => $machine->department?->name,
                'productionUrl' => '/employee/production/my?machine_barcode=' . urlencode((string) $machine->barcode),
            ])->values(),
        ]);
    }

    public function showDetails(int $employeeId)
    {
        $employee = $this->userService->getEmployeeDetailsWithRelations($employeeId);

        return Inertia::render('employee/share/employee-details', [
            'employee' => $employee,
        ]);
    }

    public function showEmployeeProfile()
    {
        $address = $this->userProfileService->getAddressData();

        return Inertia::render('employee/profile/show', [
            'address' => $address,
        ]);
    }

    public function showAddress()
    {
        $address = $this->userProfileService->getAddressData();
        $user = Auth::user();

        return Inertia::render('employee/address/show', [
            'address' => $address,
            'user' => $user,
        ]);
    }
    public function editAddress()
    {
        return Inertia::render('employee/address/edit');
    }
    public function createAddress()
    {
        return Inertia::render('employee/address/create');
    }
    public function storeAddress(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'phone' => 'nullable|string|max:15',
            'pesel' => 'nullable|string|size:11',
            'address' => 'required|string|max:1000',
            'profile_photo' => 'nullable|file|mimes:jpg,jpeg,png|max:10240',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:15',
        ]);

        // obsługa zdjęcia profilowego przez serwis
        if ($request->hasFile('profile_photo')) {
            /** @var UploadedFile $file */
            $file = $request->file('profile_photo');
            $path = $this->userProfileService->storeProfilePhoto($file, $user);
            $validated['profile_photo'] = $path;
        }

        $profile = $this->userProfileService->getProfile($user);

        if ($profile) {
            $this->userProfileService->updateProfile($profile, $validated);
        } else {
            $this->userProfileService->createProfile($user, $validated);
        }


        $this->flagRepository->addressFlagsByUser();

        return redirect()->route('employee.profile.show')->with('success', 'Profil został zapisany.');
    }

    public function showCompany()
    {

    $company = $this->employmentCertificateService->getCertificatesByUserId(Auth::id());
        return Inertia::render('employee/company/show', [
            'company' => $company,
        ]);
    }

    public function createCompany()
    {
        return Inertia::render('employee/company/create');
    }

    public function editCompany()
    {
        return Inertia::render('employee/company/edit');
    }

    public function storeCompany(Request $request)
    {


        $validatedData = $request->validate([

            'nip' => 'required|string|size:10',
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'street' => 'nullable|string|max:255',
            'zip' => 'nullable|string|max:10',
            'city' => 'nullable|string|max:100',
            'workCertificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',
        ]);

        $user = Auth::user();

        // map incoming request fields to model fillable keys and include user_id
        $payload = [
            'user_id' => $user->id,
            'nip' => $validatedData['nip'],
            'company_name' => $validatedData['name'] ?? null,
            'street' => $validatedData['street'] ?? null,
            'zip_code' => $validatedData['zip'] ?? null,
            'city' => $validatedData['city'] ?? null,
            'start_date' => $request->input('workStartDate'),
            'end_date' => $request->input('workEndDate'),
            'position' => $request->input('position'),
            'additional_info' => $request->input('jobDescription'),
        ];

        // handle uploaded work certificate file
        if ($request->hasFile('workCertificate')) {
            $file = $request->file('workCertificate');
            $extension = $file->getClientOriginalExtension();
            $uniqueName = 'work_certificate_' . $user->id . '_' . time() . '_' . uniqid() . '.' . $extension;
            $path = $file->storeAs('work_certificates', $uniqueName, 'public');
            $payload['work_certificate_file_path'] = $path;
        }

        $work_certification = $this->employmentCertificateService->employeeCreateCertificate($payload);

        if ($work_certification) {
            $this->flagRepository->employmentFlagsByUser();
        } else {
            return back()->withErrors([
                'company' => 'Wystąpił błąd podczas zapisywania firmy.'
            ]);
        }


        // Tymczasowo wyświetlamy dane
        return redirect()->route('employee.company.show')->with('success', 'Firma została pomyślnie dodana!');
    }

    public function updateCompany(Request $request)
    {
        dd('update company', $request->all());
    }

    public function createEducation()
    {
        return Inertia::render('employee/education/create');
    }

    public function showEducation()
    {
        return Inertia::render('employee/education/show');
    }

    public function editEducation()
    {
        return Inertia::render('employee/education/edit');
    }

    public function storeEducation(Request $request)
    {
        // Pokaż wszystkie dane przesyłane z formularza React/Inertia


        $validatedData = $request->validate([
            'startYear' => 'required|integer|min:1900|max:2030',
            'endYear' => 'nullable|integer|min:1900|max:2030|gte:startYear',
            'degree' => 'required|string|in:primary,gymnasium,secondary,vocational,bachelor,engineer,master,doctor',
            'schoolName' => 'required|string|max:255',
            'schoolAddress' => 'nullable|string|max:500',
            'isOngoing' => 'boolean',
            'certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',
        ]);

        $user = Auth::user();

        // Handle certificate file upload
        if ($request->hasFile('certificate')) {
            $file = $request->file('certificate');
            $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $extension = $file->getClientOriginalExtension();
            $uniqueName = 'certificate_' . $user->id . '_' . time() . '_' . uniqid() . '.' . $extension;
            $path = $file->storeAs('certificates', $uniqueName, 'public');
            $validatedData['certificate_path'] = $path;
        }

        $education = $this->educationService->createSchoolCertificate($user, $validatedData);
        if($education) {
            $this->flagRepository->educationFlagsByUser();
        } else {
            return back()->withErrors([
                'education' => 'Wystąpił błąd podczas zapisywania edukacji.'
            ]);
        }
        // Tymczasowo wyświetlamy dane
        return redirect()->route('employee.education.show')->with('success', 'Edukacja została pomyślnie dodana!');
    }

    public function updateEducation(Request $request)
    {
        dd('update education', $request->all());
    }

    public function showEducationDetails(Request $request)
    {
        $user = Auth::user();
        $page = (int) $request->get('page', 1);
       $maxEducation = $this->educationService->getMaximumEducationLevelForUser($user->id);
      //  dd($maxEducation);
        // get paginated certificates for current user (4 per page)
        $certificates = $this->educationService->getPaginatedCertificatesForUser($user, 4);

        // get current certificate - for now show the first one from current page
        $education = $certificates->items()[0] ?? null;

        // prepare pagination data for individual certificate navigation
        $pagination = null;
        if ($certificates->total() > 1) {
            $currentPage = $certificates->currentPage();
            $totalPages = $certificates->lastPage();

            $pagination = [
                'prev_url' => $currentPage > 1 ?
                    route('employee.education.show', ['page' => $currentPage - 1]) :
                    null,
                'next_url' => $currentPage < $totalPages ?
                    route('employee.education.show', ['page' => $currentPage + 1]) :
                    null,
                'current' => $currentPage,
                'total' => $totalPages
            ];
        }

        return Inertia::render('employee/education/show-details', [
            'education' => $education,
            'pagination' => $pagination,
        ]);
    }

    public function myProduction(Request $request)
    {
        $userId = Auth::id();

        $plans = OrderItemProductionPlan::query()
            ->with([
                'order:id,barcode,customer_name',
                'item:id,name',
                'operation:id,operation_name,barcode',
                'machine:id,name,barcode,last_operationmachine_id,last_items_finished_good_id',
            ])
            ->where('assigned_user_id', $userId)
            ->whereIn('status', [
                OrderItemProductionPlanStatus::DODANO_PRACOWNIKA->value,
                OrderItemProductionPlanStatus::ROZPOCZETO_PROCES->value,
            ])
            ->orderByDesc('planned_start_at')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('employee/production/my-production', [
            'plans' => $plans,
        ]);
    }

    public function productionHistory(Request $request)
    {
        $userId = Auth::id();

        $plans = OrderItemProductionPlan::query()
            ->with([
                'order:id,barcode,customer_name',
                'item:id,name',
                'operation:id,operation_name,barcode',
                'machine:id,name,barcode,last_operationmachine_id,last_items_finished_good_id',
            ])
            ->where('assigned_user_id', $userId)
            ->whereIn('status', [
                OrderItemProductionPlanStatus::ZAKONCZONO_PROCES->value,
                OrderItemProductionPlanStatus::ODRZUCONO_PROCES->value,
            ])
            ->orderByDesc('planned_end_at')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('employee/production/history', [
            'plans' => $plans,
        ]);
    }

    public function machineOperationsForPlan(Request $request, int $planId)
    {
        $userId = Auth::id();

        $validated = $request->validate([
            'machine_barcode' => ['required', 'string', 'size:13'],
        ]);

        $plan = OrderItemProductionPlan::query()
            ->where('id', $planId)
            ->where('assigned_user_id', $userId)
            ->first();

        if (!$plan) {
            return response()->json(['message' => 'Plan nie został znaleziony.'], 404);
        }

        $machine = Machines::query()
            ->with('operations:id,machine_id,operation_name')
            ->where('barcode', $validated['machine_barcode'])
            ->first();

        if (!$machine) {
            return response()->json(['message' => 'Nie znaleziono maszyny o podanym kodzie.'], 404);
        }

        if ((int) $plan->machine_id !== (int) $machine->id) {
            return response()->json(['message' => 'To nie jest maszyna przypisana do tego zadania.'], 422);
        }

        return response()->json([
            'machine' => [
                'id' => $machine->id,
                'name' => $machine->name,
                'barcode' => $machine->barcode,
            ],
            'operations' => $machine->operations->map(fn ($operation) => [
                'id' => $operation->id,
                'name' => $operation->operation_name,
            ])->values(),
            'default_operation_id' => $plan->operationmachine_id,
        ]);
    }

    public function startProduction(Request $request, int $planId)
    {
        $userId = Auth::id();

        $validated = $request->validate([
            'machine_barcode' => ['required', 'string', 'size:13'],
            'operationmachine_id' => ['required', 'integer', 'exists:operationmachines,id'],
        ]);

        $plan = OrderItemProductionPlan::query()
            ->where('id', $planId)
            ->where('assigned_user_id', $userId)
            ->first();

        if (!$plan) {
            return back()->with('error', 'Plan nie został znaleziony.');
        }

        $machine = Machines::query()
            ->with('operations:id,machine_id')
            ->where('barcode', $validated['machine_barcode'])
            ->first();

        if (!$machine) {
            return back()->with('error', 'Nie znaleziono maszyny o podanym kodzie.');
        }

        if ((int) $plan->machine_id !== (int) $machine->id) {
            return back()->with('error', 'To nie jest maszyna przypisana do tego zadania.');
        }

        $allowedOperationIds = $machine->operations->pluck('id')->all();
        if (!in_array((int) $validated['operationmachine_id'], $allowedOperationIds, true)) {
            return back()->with('error', 'Wybrana operacja nie jest dostępna na tej maszynie.');
        }

        $plan->operationmachine_id = (int) $validated['operationmachine_id'];
        $plan->status = OrderItemProductionPlanStatus::ROZPOCZETO_PROCES->value;
        $plan->planned_start_at = now();
        $plan->save();

        return back()->with('success', 'Produkcja została rozpoczęta.');
    }

    public function productionWorkbench(int $planId)
    {
        $userId = Auth::id();

        $plan = OrderItemProductionPlan::query()
            ->with([
                'order:id,barcode,customer_name',
                'item:id,name',
                'operation:id,operation_name,barcode,changeover_time',
                'machine:id,name,barcode,last_operationmachine_id,last_items_finished_good_id',
                'step:id,step_number,production_schema_id,production_time_seconds',
            ])
            ->where('id', $planId)
            ->where('assigned_user_id', $userId)
            ->first();

        if (!$plan) {
            abort(404, 'Plan nie został znaleziony.');
        }

        $tasks = OrderItemProductionPlan::query()
            ->with([
                'operation:id,operation_name,barcode,changeover_time',
                'machine:id,name,barcode,last_operationmachine_id,last_items_finished_good_id',
                'step:id,step_number,production_time_seconds',
            ])
            ->where('assigned_user_id', $userId)
            ->where('order_item_id', $plan->order_item_id)
            ->where('production_schema_id', $plan->production_schema_id)
            ->orderBy('production_schema_step_id')
            ->get();

        $machine = $plan->machine;
        $changeoverRequired = $machine
            ? ((int) $machine->last_operationmachine_id !== (int) $plan->operationmachine_id
                || (int) $machine->last_items_finished_good_id !== (int) $plan->items_finished_good_id)
            : false;

        $suggestedTaskId = $tasks
            ->sortBy(function ($task) use ($machine) {
                if ($task->status === OrderItemProductionPlanStatus::ZAKONCZONO_PROCES->value) {
                    return 10000;
                }

                if ($machine && (int) $task->operationmachine_id === (int) $machine->last_operationmachine_id) {
                    return 0;
                }

                return 100;
            })
            ->first()?->id;

        $taskIds = $tasks->pluck('id')->values();
        $activityEvents = OrderItemProductionEvent::query()
            ->whereIn('order_item_production_plan_id', $taskIds)
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->limit(100)
            ->get([
                'id',
                'order_item_production_plan_id',
                'event_type',
                'message',
                'occurred_at',
                'norm_required_seconds',
                'actual_task_seconds',
                'norm_usage_percent',
                'norm_performance_percent',
            ])
            ->map(fn (OrderItemProductionEvent $event) => [
                'id' => $event->id,
                'task_plan_id' => $event->order_item_production_plan_id,
                'event_type' => $event->event_type,
                'message' => $event->message,
                'occurred_at' => optional($event->occurred_at)->toDateTimeString(),
                'norm_required_seconds' => $event->norm_required_seconds,
                'actual_task_seconds' => $event->actual_task_seconds,
                'norm_usage_percent' => $event->norm_usage_percent,
                'norm_performance_percent' => $event->norm_performance_percent,
            ])
            ->values();

        return Inertia::render('employee/production/workbench', [
            'plan' => $plan,
            'tasks' => $tasks,
            'changeoverRequired' => $changeoverRequired,
            'suggestedTaskId' => $suggestedTaskId,
            'activityEvents' => $activityEvents,
        ]);
    }

    public function startMachineChangeover(Request $request, int $planId)
    {
        $validated = $request->validate([
            'machine_barcode' => ['required', 'string', 'size:13'],
            'task_plan_id' => ['required', 'integer', 'exists:order_item_production_plans,id'],
        ]);

        $rootPlan = OrderItemProductionPlan::query()
            ->where('id', $planId)
            ->where('assigned_user_id', Auth::id())
            ->firstOrFail();

        $plan = OrderItemProductionPlan::query()
            ->with(['machine:id,barcode,last_operationmachine_id,last_items_finished_good_id'])
            ->where('id', $validated['task_plan_id'])
            ->where('assigned_user_id', Auth::id())
            ->where('order_item_id', $rootPlan->order_item_id)
            ->where('production_schema_id', $rootPlan->production_schema_id)
            ->first();

        if (!$plan) {
            return back()->with('error', 'Wybrane zadanie nie należy do tego schematu.');
        }

        $machine = Machines::query()->find($plan->machine_id);
        if (!$machine || $machine->barcode !== $validated['machine_barcode']) {
            return back()->with('error', 'Niepoprawny barcode maszyny dla przezbrojenia.');
        }

        $changeoverRequired = ((int) ($machine->last_operationmachine_id ?? 0) !== (int) ($plan->operationmachine_id ?? 0))
            || ((int) ($machine->last_items_finished_good_id ?? 0) !== (int) ($plan->items_finished_good_id ?? 0));

        if (!$changeoverRequired) {
            return back()->with('error', 'Przezbrojenie nie jest wymagane dla tego zadania.');
        }

        $notes = $this->decodeNotes($plan->notes);
        if (!empty($notes['changeover_ended_at'])) {
            return back()->with('error', 'Przezbrojenie zostało już zakończone.');
        }

        $notes['changeover_started_at'] = now()->toDateTimeString();
        $notes['changeover_required_seconds'] = (int) round(((float) ($plan->operation?->changeover_time ?? 0)) * 60);
        $notes['changeover_ended_at'] = null;
        $notes = $this->appendActivityLog($notes, 'Rozpoczęto przezbrojenie maszyny.');
        $plan->notes = json_encode($notes, JSON_UNESCAPED_UNICODE);
        $plan->save();
        $this->storeProductionEvent($plan, 'Rozpoczęto przezbrojenie maszyny.', 'info');

        return back()->with('success', 'Przezbrojenie rozpoczęte.');
    }

    public function endMachineChangeover(Request $request, int $planId)
    {
        $validated = $request->validate([
            'machine_barcode' => ['required', 'string', 'size:13'],
            'task_plan_id' => ['required', 'integer', 'exists:order_item_production_plans,id'],
        ]);

        $rootPlan = OrderItemProductionPlan::query()
            ->where('id', $planId)
            ->where('assigned_user_id', Auth::id())
            ->firstOrFail();

        $plan = OrderItemProductionPlan::query()
            ->where('id', $validated['task_plan_id'])
            ->where('assigned_user_id', Auth::id())
            ->where('order_item_id', $rootPlan->order_item_id)
            ->where('production_schema_id', $rootPlan->production_schema_id)
            ->first();

        if (!$plan) {
            return back()->with('error', 'Wybrane zadanie nie należy do tego schematu.');
        }

        $machine = Machines::query()->find($plan->machine_id);
        if (!$machine || $machine->barcode !== $validated['machine_barcode']) {
            return back()->with('error', 'Niepoprawny barcode maszyny dla zakończenia przezbrojenia.');
        }

        $notes = $this->decodeNotes($plan->notes);
        if (empty($notes['changeover_started_at'])) {
            return back()->with('error', 'Najpierw rozpocznij przezbrojenie.');
        }

        if (!empty($notes['changeover_ended_at'])) {
            return back()->with('error', 'Przezbrojenie zostało już zakończone.');
        }

        $notes['changeover_ended_at'] = now()->toDateTimeString();
        if (!empty($notes['changeover_started_at'])) {
            $notes['changeover_duration_seconds'] = Carbon::parse($notes['changeover_started_at'])->diffInSeconds(now());
        }
        $notes = $this->appendActivityLog($notes, 'Zakończono przezbrojenie maszyny.');
        $plan->notes = json_encode($notes, JSON_UNESCAPED_UNICODE);
        $plan->save();
        $this->storeProductionEvent($plan, 'Zakończono przezbrojenie maszyny.', 'success');

        return back()->with('success', 'Przezbrojenie zakończone.');
    }

    public function startTaskByBarcode(Request $request, int $planId)
    {
        $validated = $request->validate([
            'task_plan_id' => ['required', 'integer', 'exists:order_item_production_plans,id'],
            'operation_barcode' => ['required', 'string', 'size:13'],
        ]);

        $rootPlan = OrderItemProductionPlan::query()
            ->where('id', $planId)
            ->where('assigned_user_id', Auth::id())
            ->firstOrFail();

        $task = OrderItemProductionPlan::query()
            ->with(['operation:id,barcode', 'machine:id,barcode'])
            ->where('id', $validated['task_plan_id'])
            ->where('assigned_user_id', Auth::id())
            ->where('order_item_id', $rootPlan->order_item_id)
            ->where('production_schema_id', $rootPlan->production_schema_id)
            ->first();

        if (!$task) {
            return back()->with('error', 'Zadanie nie należy do tego schematu lub pracownika.');
        }

        if (($task->operation?->barcode ?? null) !== $validated['operation_barcode']) {
            return back()->with('error', 'Barcode operacji nie pasuje do wybranego zadania.');
        }

        if ($task->status === OrderItemProductionPlanStatus::ZAKONCZONO_PROCES->value) {
            return back()->with('error', 'To zadanie zostało już zakończone.');
        }

        $machine = Machines::query()->find($task->machine_id);
        $changeoverRequired = $machine
            ? (((int) ($machine->last_operationmachine_id ?? 0) !== (int) ($task->operationmachine_id ?? 0))
                || ((int) ($machine->last_items_finished_good_id ?? 0) !== (int) ($task->items_finished_good_id ?? 0)))
            : false;

        $notes = $this->decodeNotes($task->notes);
        if ($changeoverRequired && empty($notes['changeover_ended_at'])) {
            return back()->with('error', 'Najpierw zakończ przezbrojenie dla tego zadania.');
        }

        $task->status = OrderItemProductionPlanStatus::ROZPOCZETO_PROCES->value;
        $task->planned_start_at = now();

        $notes['task_started_at'] = now()->toDateTimeString();
        $notes = $this->appendActivityLog($notes, 'Rozpoczęto produkcję zadania.');
        $task->notes = json_encode($notes, JSON_UNESCAPED_UNICODE);

        $task->save();
        $this->storeProductionEvent($task, 'Rozpoczęto produkcję zadania.', 'info');

        return back()->with('success', 'Zadanie zostało rozpoczęte.');
    }

    public function finishTaskByMachineScan(Request $request, int $planId)
    {
        $validated = $request->validate([
            'task_plan_id' => ['required', 'integer', 'exists:order_item_production_plans,id'],
            'operation_barcode' => ['required', 'string', 'size:13'],
        ]);

        $rootPlan = OrderItemProductionPlan::query()
            ->where('id', $planId)
            ->where('assigned_user_id', Auth::id())
            ->firstOrFail();

        $task = OrderItemProductionPlan::query()
            ->with(['machine:id,barcode', 'step:id,production_time_seconds', 'operation:id,operation_name,barcode'])
            ->where('id', $validated['task_plan_id'])
            ->where('assigned_user_id', Auth::id())
            ->where('order_item_id', $rootPlan->order_item_id)
            ->where('production_schema_id', $rootPlan->production_schema_id)
            ->first();

        if (!$task) {
            return back()->with('error', 'Zadanie nie należy do tego schematu lub pracownika.');
        }

        if (($task->operation?->barcode ?? null) !== $validated['operation_barcode']) {
            return back()->with('error', 'Barcode operacji nie pasuje do zadania.');
        }

        if ($task->status !== OrderItemProductionPlanStatus::ROZPOCZETO_PROCES->value) {
            return back()->with('error', 'Najpierw rozpocznij zadanie.');
        }

        $endAt = now();
        $task->planned_end_at = $endAt;
        $task->status = OrderItemProductionPlanStatus::ZAKONCZONO_PROCES->value;

        $notes = $this->decodeNotes($task->notes);

        $notes['task_finished_at'] = $endAt->toDateTimeString();

        $taskStartAt = null;
        if (!empty($notes['task_started_at'])) {
            $taskStartAt = Carbon::parse($notes['task_started_at']);
        } elseif ($task->planned_start_at) {
            $taskStartAt = Carbon::parse($task->planned_start_at);
        }

        $actualTaskSeconds = $taskStartAt ? $taskStartAt->diffInSeconds($endAt) : 0;
        $notes['task_duration_seconds'] = $actualTaskSeconds;
        $notes['actual_task_seconds'] = $actualTaskSeconds;

        $orderQuantity = max(1, (int) ($task->order_quantity ?? 1));
        $normSecondsPerUnit = max(0, (int) round((float) ($task->step?->production_time_seconds ?? 0)));
        $requiredTaskNormSeconds = $normSecondsPerUnit * $orderQuantity;

        $notes['norm_seconds_per_unit'] = $normSecondsPerUnit;
        $notes['norm_required_seconds'] = $requiredTaskNormSeconds;

        $notes['norm_usage_percent'] = $requiredTaskNormSeconds > 0
            ? round(($actualTaskSeconds / $requiredTaskNormSeconds) * 100, 2)
            : null;

        $notes['norm_performance_percent'] = ($requiredTaskNormSeconds > 0 && $actualTaskSeconds > 0)
            ? round(($requiredTaskNormSeconds / $actualTaskSeconds) * 100, 2)
            : null;

        $requiredChangeoverSeconds = (int) ($notes['changeover_required_seconds'] ?? 0);
        $actualChangeoverSeconds = (int) ($notes['changeover_duration_seconds'] ?? 0);

        if ($requiredChangeoverSeconds > 0) {
            $notes['changeover_usage_percent'] = round(($actualChangeoverSeconds / $requiredChangeoverSeconds) * 100, 2);
            $notes['changeover_performance_percent'] = $actualChangeoverSeconds > 0
                ? round(($requiredChangeoverSeconds / $actualChangeoverSeconds) * 100, 2)
                : null;
        }

        $normPercentText = $notes['norm_performance_percent'] !== null
            ? number_format((float) $notes['norm_performance_percent'], 2, '.', '') . '%'
            : 'brak normy';

        $notes = $this->appendActivityLog(
            $notes,
            'Zakończono produkcję zadania. Czas rzeczywisty: ' . $actualTaskSeconds . 's, norma: ' . $requiredTaskNormSeconds . 's, wykonanie normy: ' . $normPercentText
        );

        $task->notes = json_encode($notes, JSON_UNESCAPED_UNICODE);
        $task->save();
        $this->storeProductionEvent(
            $task,
            'Zakończono produkcję zadania. Czas rzeczywisty: ' . $actualTaskSeconds . 's, norma: ' . $requiredTaskNormSeconds . 's, wykonanie normy: ' . $normPercentText,
            'success',
            [
                'norm_required_seconds' => $requiredTaskNormSeconds,
                'actual_task_seconds' => $actualTaskSeconds,
                'norm_usage_percent' => $notes['norm_usage_percent'] ?? null,
                'norm_performance_percent' => $notes['norm_performance_percent'] ?? null,
            ]
        );

        if ($task->machine_id) {
            $machine = Machines::query()->find($task->machine_id);
            if ($machine) {
                $machine->update([
                    'last_operationmachine_id' => $task->operationmachine_id,
                    'last_items_finished_good_id' => $task->items_finished_good_id,
                ]);
            }
        }

        return back()->with('success', 'Zadanie zostało zakończone i zapisane.');
    }

    private function decodeNotes(?string $notes): array
    {
        $decoded = json_decode((string) ($notes ?? '{}'), true);
        return is_array($decoded) ? $decoded : [];
    }

    private function appendActivityLog(array $notes, string $message): array
    {
        $current = $notes['activity_log'] ?? [];
        if (!is_array($current)) {
            $current = [];
        }

        array_unshift($current, [
            'at' => now()->toDateTimeString(),
            'message' => $message,
        ]);

        $notes['activity_log'] = array_slice($current, 0, 50);
        return $notes;
    }

    private function storeProductionEvent(
        OrderItemProductionPlan $plan,
        string $message,
        string $eventType = 'info',
        array $metrics = []
    ): void {
        OrderItemProductionEvent::query()->create([
            'order_item_production_plan_id' => $plan->id,
            'user_id' => Auth::id(),
            'event_type' => in_array($eventType, ['info', 'success', 'warning'], true) ? $eventType : 'info',
            'message' => $message,
            'norm_required_seconds' => isset($metrics['norm_required_seconds']) ? (int) $metrics['norm_required_seconds'] : null,
            'actual_task_seconds' => isset($metrics['actual_task_seconds']) ? (int) $metrics['actual_task_seconds'] : null,
            'norm_usage_percent' => isset($metrics['norm_usage_percent']) && $metrics['norm_usage_percent'] !== null
                ? (float) $metrics['norm_usage_percent']
                : null,
            'norm_performance_percent' => isset($metrics['norm_performance_percent']) && $metrics['norm_performance_percent'] !== null
                ? (float) $metrics['norm_performance_percent']
                : null,
            'payload' => empty($metrics) ? null : $metrics,
            'occurred_at' => now(),
        ]);
    }
}
