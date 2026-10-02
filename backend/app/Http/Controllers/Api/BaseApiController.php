<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

abstract class BaseApiController extends Controller
{
    /**
     * Mengembalikan format JSON envelope standar untuk respon sukses.
     */
    protected function sendResponse(mixed $data, string $message = 'Operasi berhasil', int $code = 200, array $meta = []): JsonResponse
    {
        $response = [
            'status' => 'success',
            'message' => $message,
            'data' => $data,
            'meta' => array_merge([
                'timestamp' => now()->toIso8601String(),
                'api_version' => 'v1',
            ], $meta),
        ];

        return response()->json($response, $code);
    }

    /**
     * Mengembalikan format JSON envelope standar untuk respon error/kegagalan.
     */
    protected function sendError(string $error, mixed $errorMessages = [], int $code = 404, ?string $errorCode = null): JsonResponse
    {
        $response = [
            'status' => $code >= 500 ? 'error' : 'fail',
            'message' => $error,
            'error_code' => $errorCode,
        ];

        if (!empty($errorMessages)) {
            $response['errors'] = $errorMessages;
        }

        return response()->json($response, $code);
    }
}
