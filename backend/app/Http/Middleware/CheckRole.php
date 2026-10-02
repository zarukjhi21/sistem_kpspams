<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request and ensure user has at least one of the specified roles.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated.',
                'error_code' => 'UNAUTHENTICATED',
            ], 401);
        }

        // Super Admin bypasses all role checks
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        if (!$user->hasAnyRole($roles)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak: Anda tidak memiliki peran yang diizinkan untuk mengakses tindakan ini.',
                'error_code' => 'FORBIDDEN_ROLE',
            ], 403);
        }

        return $next($request);
    }
}
