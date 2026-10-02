<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizePaginationMiddleware
{
    /**
     * Cap per_page parameter to a maximum of 100 to prevent DoS via memory exhaustion.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->has('per_page')) {
            $perPage = $request->integer('per_page', 20);
            if ($perPage > 100) {
                $request->merge(['per_page' => 100]);
            } elseif ($perPage < 1) {
                $request->merge(['per_page' => 20]);
            }
        }

        return $next($request);
    }
}
