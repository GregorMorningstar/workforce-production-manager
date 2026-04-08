<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $shared = [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? [
                    ...$request->user()->load('profile')->toArray(),
                    'role' => $request->user()->role->value, // Konwertuj enum na string
                ] : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'assignment_summary' => $request->session()->get('assignment_summary', []),
            ],
        ];

        $user = $request->user();
        if ($user && $user->role === \App\Enums\UserRole::EMPLOYEE) {
            $completed = 0;
            $total = 3;

            $educationCompleted = (bool) ($user->is_complited_education ?? false);
            $workTimeCompleted = (bool) ($user->is_complited_work_time ?? false);
            $addressCompleted = (bool) ($user->is_complited_address ?? false);

            if ($educationCompleted) $completed++;
            if ($workTimeCompleted) $completed++;
            if ($addressCompleted) $completed++;

            $overallCompletion = round(($completed / $total) * 100, 2);
            $profileComplete = $completed === $total;

            $shared['profileComplete'] = $profileComplete;
            $shared['profileStatus'] = [
                'education_completed' => $educationCompleted,
                'work_time_completed' => $workTimeCompleted,
                'address_completed' => $addressCompleted,
                'overall_completion' => $overallCompletion,
            ];
        } else {
            // Debug log dla innych ról
            \Log::info('Non-employee user', [
                'user_id' => $user?->id ?? 'no user',
                'role' => $user?->role?->value ?? 'no role'
            ]);

            $shared['profileComplete'] = true;
            $shared['profileStatus'] = null;
        }

        return $shared;
    }
}
