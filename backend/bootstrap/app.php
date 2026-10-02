<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        $middleware->alias([
            'tenant.kpspams' => \App\Http\Middleware\EnforceKpspamsScope::class,
            'audit.context' => \App\Http\Middleware\AuditContextMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Enforce JSON responses for all /api requests
        $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $e) {
            if ($request->is('api/*')) {
                return true;
            }
            return $request->expectsJson();
        });

        // Standardized 404 Response
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data atau rute tidak ditemukan.',
                    'error_code' => 'RESOURCE_NOT_FOUND',
                ], 404);
            }
        });

        // Standardized 403 Response
        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => $e->getMessage() ?: 'Akses Ditolak: Anda tidak memiliki otoritas atas data ini.',
                    'error_code' => 'ACCESS_DENIED',
                ], 403);
            }
        });
    })->create();
