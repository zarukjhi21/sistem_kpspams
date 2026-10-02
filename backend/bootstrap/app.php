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
            \App\Http\Middleware\SecurityHeadersMiddleware::class,
            \App\Http\Middleware\SanitizePaginationMiddleware::class,
        ]);

        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('api/*') ? null : '/login');

        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
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

        // Standardized 405 Method Not Allowed Response
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Metode HTTP tidak diizinkan untuk rute ini.',
                    'error_code' => 'METHOD_NOT_ALLOWED',
                ], 405);
            }
        });

        // Standardized 401 Authentication Response
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthenticated: Token autentikasi tidak valid atau belum disediakan.',
                    'error_code' => 'UNAUTHENTICATED',
                ], 401);
            }
        });

        // Standardized 403 Authorization Response
        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => $e->getMessage() ?: 'Akses Ditolak: Anda tidak memiliki otoritas atas data ini.',
                    'error_code' => 'ACCESS_DENIED',
                ], 403);
            }
        });

        // Standardized 404 Model Not Found Response
        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Data atau rute tidak ditemukan.',
                    'error_code' => 'RESOURCE_NOT_FOUND',
                ], 404);
            }
        });

        // Standardized 422 Validation Response
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Validasi data gagal.',
                    'errors' => $e->errors(),
                    'error_code' => 'VALIDATION_FAILED',
                ], 422);
            }
        });

        // Standardized Database Error Response (No raw SQL leakage in production)
        $exceptions->render(function (\Illuminate\Database\QueryException $e, Request $request) {
            if ($request->is('api/*')) {
                \Illuminate\Support\Facades\Log::error('API Database Error: ' . $e->getMessage(), [
                    'url' => $request->fullUrl(),
                    'method' => $request->method(),
                ]);

                $message = config('app.debug') 
                    ? $e->getMessage() 
                    : 'Terjadi kegagalan pemrosesan basis data pada server.';

                return response()->json([
                    'status' => 'error',
                    'message' => $message,
                    'error_code' => 'DATABASE_ERROR',
                ], 500);
            }
        });

        // Standardized 500 Generic Error Response (No stack trace or internal path leakage)
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*')) {
                // If it's an HTTP exception or already handled exception, let it pass through
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface
                    || $e instanceof \Illuminate\Auth\AuthenticationException
                    || $e instanceof \Illuminate\Validation\ValidationException
                    || $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException
                    || $e instanceof \Illuminate\Auth\Access\AuthorizationException) {
                    return null;
                }

                \Illuminate\Support\Facades\Log::error('API Unhandled Exception: ' . $e->getMessage(), [
                    'url' => $request->fullUrl(),
                    'method' => $request->method(),
                    'trace' => $e->getTraceAsString(),
                ]);

                $message = config('app.debug') 
                    ? $e->getMessage() 
                    : 'Terjadi kesalahan internal pada server. Silakan hubungi administrator.';

                return response()->json([
                    'status' => 'error',
                    'message' => $message,
                    'error_code' => 'INTERNAL_SERVER_ERROR',
                ], 500);
            }
        });
    })->create();
