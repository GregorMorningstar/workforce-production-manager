<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\Contracts\LeavesServiceInterface;
use App\Enums\LeavesType;
use App\Enums\LeavesStatus;
use Carbon\Carbon;
use Inertia\Inertia;

class CalendarController extends Controller
{

    public function __construct(private readonly LeavesServiceInterface $leavesService)
    {}


    public function index()
    {

        $userleavesById = $this->leavesService->getAllLeavesByUserId(auth()->id());
        return inertia('employee/calendar/index', ['userleavesById' => $userleavesById]);
    }

    public function history()
    {
        $usedLeaves = $this->leavesService->getUsedLeavesByUser(auth()->id());
       // dd($usedLeaves);
        return inertia('employee/calendar/history', ['usedLeaves' => $usedLeaves]);
    }
    public function store(Request $request)
    {
        // Get valid enum values for validation
        $validTypes = array_map(fn($e) => $e->value, LeavesType::cases());

        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'leave_type' => 'required|string|in:' . implode(',', $validTypes),
            'description' => 'nullable|string|max:1000',
            'working_days_count' => 'nullable|integer|min:1',
        ]);
        // Check for overlapping leaves
        $existingLeaves = $this->leavesService->getAllLeavesByUserId($data['user_id']);
        $startDate = Carbon::parse($data['start_date']);
        $endDate = Carbon::parse($data['end_date']);
        foreach ($existingLeaves as $leave) {
            $existingStart = Carbon::parse($leave->start_date);
            $existingEnd = Carbon::parse($leave->end_date);

            // Check if dates overlap
            if (($startDate <= $existingEnd) && ($endDate >= $existingStart)) {
                return back()->withErrors([
                    'leave_type' => 'Urlop nakłada się z istniejącym urlopem od ' .
                                   $existingStart->format('Y-m-d') . ' do ' . $existingEnd->format('Y-m-d')
                ])->withInput();
            }
        }

        // Calculate working days
        $workingDays = $this->calculateWorkingDays($startDate, $endDate);

        // Map frontend fields to backend expected format
        $mappedData = [
            'user_id' => $data['user_id'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'type' => $data['leave_type'],
            'description' => $data['description'] ?? null,
            'days' => $workingDays,
            'status' => LeavesStatus::PENDING->value,
        ];

        $this->leavesService->store($mappedData);

        return redirect()->route('employee.calendar.index')
                        ->with('success', 'Wniosek urlopu został złożony pomyślnie.');
    }

    /**
     * Calculate working days between two dates (excluding weekends)
     */
    private function calculateWorkingDays(Carbon $startDate, Carbon $endDate): int
    {
        $workingDays = 0;
        $current = $startDate->copy();

        while ($current <= $endDate) {
            // Skip weekends (Saturday = 6, Sunday = 0)
            if ($current->dayOfWeek !== Carbon::SATURDAY && $current->dayOfWeek !== Carbon::SUNDAY) {
                $workingDays++;
            }
            $current->addDay();
        }

        return $workingDays;
    }

    public function show($id)
    {
        $leave = $this->leavesService->getLeavesById($id);
        if (!$leave) {
            abort(404, 'Nie znaleziono urlopu.');
        }

        $user = auth()->user();
        // Only owner or moderator can view
        if ($leave->user_id !== $user->id && ($user->role ?? '') !== 'moderator') {
            abort(403, 'Nie masz uprawnień do podglądu tego urlopu.');
        }

        return inertia('employee/calendar/detalis-leaves', [
            'leave' => $leave,
            'currentUserRole' => $user->role ?? 'employee',
            'currentUserId' => $user->id,
            'redirectBackInSeconds' => 5,
        ]);
    }

    public function edit($id)
    {
        $leave = $this->leavesService->getLeavesById($id);

        // Sprawdź czy użytkownik może edytować ten urlop
        if ($leave->user_id !== auth()->id()) {
            abort(403, 'Nie masz uprawnień do edycji tego urlopu.');
        }

        // Sprawdź czy urlop można edytować (tylko oczekujące)
        if ($leave->status !== LeavesStatus::PENDING->value) {
            return redirect("/employee/calendar/show/{$id}")
                           ->with('error', 'Można edytować tylko urlopy oczekujące na zatwierdzenie.');
        }

        return inertia('employee/calendar/edit', [
            'leave' => $leave,
        ]);
    }

    public function update(Request $request, $id)
    {
        $leave = $this->leavesService->getLeavesById($id);

        // Sprawdź czy użytkownik może edytować ten urlop
        if ($leave->user_id !== auth()->id()) {
            abort(403, 'Nie masz uprawnień do edycji tego urlopu.');
        }

        // Sprawdź czy urlop można edytować (tylko oczekujące)
        if ($leave->status !== LeavesStatus::PENDING->value) {
            return redirect("/employee/calendar/show/{$id}")
                           ->with('error', 'Można edytować tylko urlopy oczekujące na zatwierdzenie.');
        }

        // Walidacja danych
        $validTypes = array_map(fn($e) => $e->value, LeavesType::cases());

        $data = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'type' => 'required|string|in:' . implode(',', $validTypes),
            'description' => 'nullable|string|max:1000',
            'working_days_count' => 'nullable|integer|min:1',
        ]);
        Log::info('Updating leave with data: ', $data);

        // Sprawdź regułę 3 dni dla urlopów innych niż chorobowe i okolicznościowe
        if (!in_array($data['type'], ['sick', 'compassionate'])) {
            $startDate = Carbon::parse($data['start_date']);
            $today = Carbon::now();
            $threeDaysFromNow = $today->copy()->addDays(3);

            if ($startDate->lt($threeDaysFromNow)) {
                return back()->withErrors([
                    'start_date' => 'Data rozpoczęcia musi być co najmniej 3 dni od dzisiaj (nie dotyczy urlopów chorobowych i okolicznościowych).'
                ])->withInput();
            }
        }

        $existingLeaves = $this->leavesService->getAllLeavesByUserId(auth()->id());
        $startDate = Carbon::parse($data['start_date']);
        $endDate = Carbon::parse($data['end_date']);

        foreach ($existingLeaves as $existingLeave) {
            if ($existingLeave->id == $id) {
                continue;
            }

            $existingStart = Carbon::parse($existingLeave->start_date);
            $existingEnd = Carbon::parse($existingLeave->end_date);

            if (($startDate <= $existingEnd) && ($endDate >= $existingStart)) {
                return back()->withErrors([
                    'start_date' => 'Urlop nakłada się z istniejącym urlopem od ' .
                                   $existingStart->format('Y-m-d') . ' do ' . $existingEnd->format('Y-m-d')
                ])->withInput();
            }
        }

        $mappedData = [
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'type' => $data['type'],
            'description' => $data['description'] ?? null,
            'days' => $data['working_days_count'] ?? $this->calculateWorkingDays(
                Carbon::parse($data['start_date']),
                Carbon::parse($data['end_date'])
            ),
        ];

        $this->leavesService->updateLeave($id, $mappedData);

        return redirect('/employee/calendar')
                        ->with('success', 'Urlop został zaktualizowany pomyślnie.');
    }

    public function destroy($id)
    {
        $leave = $this->leavesService->getLeavesById($id);

        // Sprawdź czy użytkownik może usunąć ten urlop
        if ($leave->user_id !== auth()->id()) {
            abort(403, 'Nie masz uprawnień do usunięcia tego urlopu.');
        }

        // Sprawdź czy urlop można usunąć (tylko oczekujące)
        if ($leave->status !== LeavesStatus::PENDING->value) {
            return redirect("/employee/calendar/show/{$id}")
                           ->with('error', 'Można usuwać tylko urlopy oczekujące na zatwierdzenie.');
        }

        // Usuń urlop
        $this->leavesService->deleteLeave($id);

        return redirect('/employee/calendar')
                        ->with('success', 'Wniosek urlopu został usunięty pomyślnie.');
    }

    public function detailsLeavesById($id){
        if (!$id) {
            abort(404, 'Nie podano ID urlopu.');
        }
        $leave = $this->leavesService->getLeavesById($id);
        if (!$leave) {
            abort(404, 'Nie znaleziono urlopu.');
        }

        $user = auth()->user();
        if ($leave->user_id !== $user->id && ($user->role ?? '') !== 'moderator') {
            abort(403, 'Nie masz uprawnień do podglądu tego urlopu.');
        }

        return Inertia::render('employee/calendar/detalis-leaves', [
            'leave' => $leave,
            'redirectBackInSeconds' => 5,
        ]);
    }
}
