<?php

namespace App\Http\Middleware;

use App\Services\UserProfileService;
use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class CheckProfileCompletion
{
    public function __construct(
        private readonly UserProfileService $userProfileService
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        try {
            if ($user && $user->role === UserRole::EMPLOYEE) {
                $isProfileComplete = $this->userProfileService->checkProfileCompletion($user->id);

                // szczegółowe informacje o statusie profilu
                $profileStatus = [
                    'education_completed' => $user->is_complited_education ?? false,
                    'work_time_completed' => $user->is_complited_work_time ?? false,
                    'address_completed' => $user->is_complited_address ?? false,
                    'overall_completion' => $this->calculateCompletion($user),
                ];

                View::share('profileComplete', $isProfileComplete);
                View::share('profileStatus', $profileStatus);
                View::share('currentUser', $user);
            } else {
                View::share('profileComplete', true);
                View::share('profileStatus', null);
            }
        } catch (\Exception $e) {
            // W przypadku błędu, nie blokuj dostępu - ustaw domyślne wartości
            \Log::error('CheckProfileCompletion middleware error: ' . $e->getMessage());
            View::share('profileComplete', true);
            View::share('profileStatus', null);
        }

        return $next($request);
    }

    private function calculateCompletion($user): float
    {
        $completed = 0;
        $total = 3;

        if ($user->is_complited_education) $completed++;
        if ($user->is_complited_work_time) $completed++;
        if ($user->is_complited_address) $completed++;

        return round(($completed / $total) * 100, 2);
    }
}
