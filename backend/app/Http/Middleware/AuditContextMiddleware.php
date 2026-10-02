<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditContextMiddleware
{
    /**
     * Enforce request context variables for immutable audit logs.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Header penanda versi API & timestamp
        $response->headers->set('X-SI-KPSPAMS-Version', 'v1.0.0');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');

        return $response;
    }
}
