<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DesaController;
use App\Http\Controllers\Api\V1\DusunController;
use App\Http\Controllers\Api\V1\KpspamsController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\ConnectionController;
use App\Http\Controllers\Api\V1\MeterController;
use App\Http\Controllers\Api\V1\MeterReadingController;
use App\Http\Controllers\Api\V1\TariffController;
use App\Http\Controllers\Api\V1\BillingPeriodController;
use App\Http\Controllers\Api\V1\BillingPolicyController;
use App\Http\Controllers\Api\V1\InvoiceController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\ComplaintController;
use App\Http\Controllers\Api\V1\WorkOrderController;
use App\Http\Controllers\Api\V1\AssetController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\FinanceController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\UserController;

Route::prefix('v1')->group(function () {

    // Public / Authentication routes
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    });

    // Health check endpoint
    Route::get('health', function () {
        return response()->json([
            'status' => 'healthy',
            'app' => config('app.name'),
            'timestamp' => now()->toIso8601String(),
        ]);
    });

    // Authenticated API Routes
    Route::middleware(['auth:sanctum'])->group(function () {

        // Auth management
        Route::prefix('auth')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
            Route::put('change-password', [AuthController::class, 'changePassword']);
        });

        // Auth & User Management
        Route::apiResource('users', UserController::class);

        // Master Wilayah & Kelembagaan
        Route::apiResource('desa', DesaController::class)->only(['index', 'update']);
        Route::apiResource('dusun', DusunController::class)->only(['index', 'show', 'store', 'update']);
        Route::apiResource('kpspams', KpspamsController::class);
        Route::post('kpspams/{id}/assign-dusun', [KpspamsController::class, 'assignDusun']);

        // Billing Policies (Jatuh tempo, denda, rekomendasi pemutusan)
        Route::get('billing-policies', [BillingPolicyController::class, 'index']);
        Route::put('billing-policies', [BillingPolicyController::class, 'update']);

        // Pelanggan, Sambungan, & Meter
        Route::apiResource('customers', CustomerController::class);
        Route::apiResource('connections', ConnectionController::class);
        Route::patch('connections/{id}/status', [ConnectionController::class, 'updateStatus']);
        Route::apiResource('meters', MeterController::class);
        Route::post('meters/{id}/replace', [MeterController::class, 'replaceMeter']);

        // Pembacaan Meter Air
        Route::get('meter-readings/route-batch', [MeterReadingController::class, 'routeBatch']);
        Route::post('meter-readings/sync-batch', [MeterReadingController::class, 'syncBatch']);
        Route::patch('meter-readings/{id}/verify', [MeterReadingController::class, 'verify']);
        Route::patch('meter-readings/{id}/resolve-anomaly', [MeterReadingController::class, 'resolveAnomaly']);
        Route::apiResource('meter-readings', MeterReadingController::class);

        // Tarif & Periode Tagihan
        Route::apiResource('tariffs', TariffController::class);
        Route::post('billing-periods/{id}/generate-invoices', [BillingPeriodController::class, 'generateInvoices']);
        Route::patch('billing-periods/{id}/close', [BillingPeriodController::class, 'closePeriod']);
        Route::apiResource('billing-periods', BillingPeriodController::class);

        // Invoice, Pembayaran, Kwitansi, & Tunggakan
        Route::get('invoices/{id}/pdf', [InvoiceController::class, 'downloadPdf']);
        Route::apiResource('invoices', InvoiceController::class)->only(['index', 'show']);
        Route::get('arrears', [InvoiceController::class, 'arrears']);

        Route::post('payments/{id}/void', [PaymentController::class, 'voidToday']);
        Route::post('payments/{id}/request-reversal', [PaymentController::class, 'requestReversal']);
        Route::post('payment-reversals/{id}/approve', [PaymentController::class, 'approveReversal']);
        Route::get('payments/{id}/receipt-pdf', [PaymentController::class, 'receiptPdf']);
        Route::apiResource('payments', PaymentController::class)->only(['index', 'show', 'store']);

        // Pengaduan & Work Order
        Route::patch('complaints/{id}/verify', [ComplaintController::class, 'verify']);
        Route::post('complaints/{id}/create-work-order', [ComplaintController::class, 'createWorkOrder']);
        Route::apiResource('complaints', ComplaintController::class);

        Route::patch('work-orders/{id}/start', [WorkOrderController::class, 'start']);
        Route::post('work-orders/{id}/complete', [WorkOrderController::class, 'complete']);
        Route::apiResource('work-orders', WorkOrderController::class);

        // Aset & Pemeliharaan
        Route::post('assets/{id}/maintenance', [AssetController::class, 'logMaintenance']);
        Route::apiResource('assets', AssetController::class);

        // Inventaris Material
        Route::get('inventory', [InventoryController::class, 'index']);
        Route::post('inventory/transactions', [InventoryController::class, 'storeTransaction']);

        // Keuangan & Kas
        Route::get('finance/cash-accounts', [FinanceController::class, 'cashAccounts']);
        Route::post('finance/cash-accounts', [FinanceController::class, 'storeCashAccount']);
        Route::post('finance/cash-accounts/{id}/opening-balance', [FinanceController::class, 'setOpeningBalance']);
        Route::get('finance/transactions', [FinanceController::class, 'transactions']);
        Route::post('finance/transactions', [FinanceController::class, 'storeTransaction']);
        Route::post('finance/transfer', [FinanceController::class, 'transfer']);

        // Dashboard & Pelaporan
        Route::get('dashboard/overview', [DashboardController::class, 'overview']);
        Route::get('reports/water-consumption', [ReportController::class, 'waterConsumption']);
        Route::get('reports/billing-collection', [ReportController::class, 'billingCollection']);
        Route::get('reports/arrears-aging', [ReportController::class, 'arrearsAging']);
        Route::get('reports/cash-flow', [ReportController::class, 'cashFlow']);
        Route::get('reports/export-pdf', [ReportController::class, 'exportPdf']);
        Route::get('reports/export-excel', [ReportController::class, 'exportExcel']);

        // Audit Log & Notifikasi
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    });
});
