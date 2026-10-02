<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceKpspamsScope
{
    /**
     * Handle an incoming request and ensure tenant context integrity.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            return $next($request);
        }

        $user = auth()->user();

        // Jika user adalah level unit KPSPAMS, abaikan dan timpa header X-KPSPAMS-Context
        if (!$user->isDesaLevel() && !$user->isSuperAdmin()) {
            if ($user->kpspams_id) {
                $request->headers->set('X-KPSPAMS-Context', (string) $user->kpspams_id);
            }
        }

        return $next($request);
    }
}
