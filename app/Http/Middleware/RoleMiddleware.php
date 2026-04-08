<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();
        if (! $user) {
            return redirect()->route('login');
        }
        if (empty($roles)) {
            return $next($request);
        }
        $role = $user->role?->value ?? null; // Pobierz wartość z enum
        $authorized = $role && in_array($role, $roles, true);
        if (! $authorized) {
            $target = function_exists('route')
                ? route('dashboard')
                : '/dashboard';
            return response()
                ->view('errors.role-denied', [
                    'targetUrl' => $target,
                    'currentRole' => $role,
                    'requiredRoles' => $roles,
                    'seconds' => 5,
                ], 403);
        }
        return $next($request);
    }
}
