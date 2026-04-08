<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\Contracts\LeavesServiceInterface;
use App\Services\ModeratorDashboardService;
use Carbon\Carbon;

class ModeratorController extends Controller
{
    public function __construct(private readonly LeavesServiceInterface $leavesInterface)
    {
    }

     public function dashboard(ModeratorDashboardService $dashboardService)
    {
         return Inertia::render('moderator/dashboard/index', $dashboardService->getDashboardData());
    }

    public function getAllLeavels()
    {
        return Inertia::render('moderator/users/levels/index');
    }

    /**
     * Wyświetl kalendarz urlopów wszystkich pracowników
     */
    public function getLeavesCalendar(Request $request)
    {
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $leaves = $this->leavesInterface->getCalendarLeaves($startDate, $endDate);
        $statistics = $this->leavesInterface->getLeavesStatistics();
        $activeLeaves = $this->leavesInterface->getActiveLeaves();

        return Inertia::render('moderator/user/leaves/index', [
            'leaves' => $leaves,
            'statistics' => $statistics,
            'activeLeaves' => $activeLeaves,
            'currentDate' => now()->format('Y-m-d'),
        ]);
    }


    public function getPendingLeaves()
    {
        $pendingLeaves = $this->leavesInterface->getPendingLeaves();

        return Inertia::render('moderator/user/leaves/pending', [
            'pendingLeaves' => $pendingLeaves,
        ]);
    }

    /**
     * Zatwierdź urlop
     */
    public function approveLeave(Request $request)
    {
        $data = $request->validate([
            'id' => 'required|integer',
            'days' => 'required|integer',
            'user_id' => 'required|integer',
            'description' => 'nullable|string',
            'type' => 'nullable|string',
            'year' => 'nullable|integer',
        ]);

        try {
            $this->leavesInterface->setLeaveBalance(
                $data['id'],
                $data['days'],
                $data['user_id'],
                $data['description'] ?? ''
            );

            return redirect()->route('moderator.leaves.pending')
                ->with('success', 'Urlop zatwierdzony.');
        } catch (\Exception $e) {
            // DEBUG: sprawdź czy łapiemy wyjątek
            \Log::info('ZŁAPAŁEM WYJĄTEK w approveLeave', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // wymuszamy pełne przeładowanie strony pending z flash error
            // zaloguj aktualną sesję i klucze flash dla diagnostyki
            \Log::info('Session before redirect (approveLeave catch)', [
                'session_all' => session()->all(),
                'flash_success' => session()->get('success'),
                'flash_error' => session()->get('error'),
                '_flash_meta' => session()->get('_flash'),
            ]);

            // usuń ewentualny success flash, ustaw error i przekieruj
            session()->forget('success');
            session()->flash('error', $e->getMessage() ?: 'Wystąpił błąd podczas zatwierdzania urlopu.');
            return redirect()->route('moderator.leaves.pending');
        }
    }


    public function rejectLeave(Request $request)
    {
        $data = $request->validate([
            'id' => 'required|integer',
            'rejection_reason' => 'required|string|min:1|max:1000',
            'days' => 'required|integer',
            'type' => 'nullable|string',
            'user_id' => 'required|integer',
            'year' => 'required|integer',
        ]);

        try {
            $meta = [
                'days' => $data['days'],
                'type' => $data['type'] ?? null,
                'user_id' => $data['user_id'],
                'year' => $data['year'] ?? null,
            ];

            $this->leavesInterface->rejectLeave(
                $data['id'],
                auth()->id(),
                $data['rejection_reason'],
                $meta
            );

            // Usuń ewentualny success i ustaw error flash na powód odrzucenia (wyświetli się czerwony komunikat)
            session()->forget('success');
            session()->flash('error', $data['rejection_reason']);

            return redirect()->route('moderator.leaves.pending');
        } catch (\Exception $e) {
            \Log::error('Error rejecting leave', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            session()->forget('success');
            session()->flash('error', $e->getMessage() ?: 'Wystąpił błąd podczas odrzucania urlopu.');
            return redirect()->route('moderator.leaves.pending');
        }
    }

    /**
     * Pobierz oczekujące urlopy konkretnego użytkownika
     */
    public function getUserPendingLeaves(int $userId)
    {
        $pendingLeaves = $this->leavesInterface->getUserPendingLeaves($userId);

        return Inertia::render('moderator/user/leaves/user-pending', [
            'pendingLeaves' => $pendingLeaves,
            'userId' => $userId,
        ]);
    }




}
