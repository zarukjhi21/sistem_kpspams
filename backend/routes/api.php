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
    Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function () {

        // Auth management
        Route::prefix('auth')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
            Route::put('change-password', [AuthController::class, 'changePassword']);
        });

        // Auth & User Management
        Route::middleware(['role:super_admin,admin_desa,ketua_kpspams'])->group(function () {
            Route::post('users', [UserController::class, 'store']);
            Route::put('users/{id}', [UserController::class, 'update']);
            Route::delete('users/{id}', [UserController::class, 'destroy']);
        });
        Route::middleware(['role:super_admin,admin_desa,pemerintah_desa,ketua_kpspams'])->group(function () {
            Route::get('users', [UserController::class, 'index']);
            Route::get('users/{id}', [UserController::class, 'show']);
        });

        // Master Wilayah & Kelembagaan
        Route::get('desa', [DesaController::class, 'index']);
        Route::put('desa/{id}', [DesaController::class, 'update'])->middleware('role:super_admin,admin_desa');
        Route::get('dusun', [DusunController::class, 'index']);
        Route::get('dusun/{id}', [DusunController::class, 'show']);
        Route::post('dusun', [DusunController::class, 'store'])->middleware('role:super_admin,admin_desa');
        Route::put('dusun/{id}', [DusunController::class, 'update'])->middleware('role:super_admin,admin_desa');
        Route::get('kpspams', [KpspamsController::class, 'index']);
        Route::get('kpspams/{id}', [KpspamsController::class, 'show']);
        Route::middleware(['role:super_admin,admin_desa'])->group(function () {
            Route::post('kpspams', [KpspamsController::class, 'store']);
            Route::put('kpspams/{id}', [KpspamsController::class, 'update']);
            Route::delete('kpspams/{id}', [KpspamsController::class, 'destroy']);
            Route::post('kpspams/{id}/assign-dusun', [KpspamsController::class, 'assignDusun']);
        });

        // Billing Policies (Jatuh tempo, denda, rekomendasi pemutusan)
        Route::get('billing-policies', [BillingPolicyController::class, 'index']);
        Route::put('billing-policies', [BillingPolicyController::class, 'update'])->middleware('role:super_admin,admin_desa,ketua_kpspams');

        // Pelanggan, Sambungan, & Meter
        Route::middleware(['role:super_admin,admin_desa,ketua_kpspams,admin_kpspams'])->group(function () {
            Route::post('customers', [CustomerController::class, 'store']);
            Route::put('customers/{id}', [CustomerController::class, 'update']);
            Route::delete('customers/{id}', [CustomerController::class, 'destroy']);
            Route::post('connections', [ConnectionController::class, 'store']);
            Route::patch('connections/{id}/status', [ConnectionController::class, 'updateStatus']);
        });
        Route::get('customers', [CustomerController::class, 'index']);
        Route::get('customers/{id}', [CustomerController::class, 'show']);
        Route::get('connections', [ConnectionController::class, 'index']);
        Route::get('connections/{id}', [ConnectionController::class, 'show']);

        Route::middleware(['role:super_admin,admin_desa,ketua_kpspams,admin_kpspams,petugas_lapangan'])->group(function () {
            Route::post('meters', [MeterController::class, 'store']);
            Route::put('meters/{id}', [MeterController::class, 'update']);
            Route::post('meters/{id}/replace', [MeterController::class, 'replaceMeter']);
        });
        Route::get('meters', [MeterController::class, 'index']);
        Route::get('meters/{id}', [MeterController::class, 'show']);

        // Pembacaan Meter Air
        Route::middleware(['role:super_admin,admin_desa,ketua_kpspams,admin_kpspams,petugas_lapangan'])->group(function () {
            Route::get('meter-readings/route-batch', [MeterReadingController::class, 'routeBatch']);
            Route::post('meter-readings/sync-batch', [MeterReadingController::class, 'syncBatch']);
            Route::post('meter-readings', [MeterReadingController::class, 'store']);
        });
        Route::middleware(['role:super_admin,admin_desa,ketua_kpspams,admin_kpspams'])->group(function () {
            Route::patch('meter-readings/{id}/verify', [MeterReadingController::class, 'verify']);
            Route::patch('meter-readings/{id}/resolve-anomaly', [MeterReadingController::class, 'resolveAnomaly']);
        });
        Route::get('meter-readings', [MeterReadingController::class, 'index']);
        Route::get('meter-readings/{id}', [MeterReadingController::class, 'show']);

        // Tarif & Periode Tagihan
        Route::get('tariffs', [TariffController::class, 'index']);
        Route::get('tariffs/{id}', [TariffController::class, 'show']);
        Route::middleware(['role:super_admin,admin_desa,ketua_kpspams'])->group(function () {
            Route::post('tariffs', [TariffController::class, 'store']);
            Route::put('tariffs/{id}', [TariffController::class, 'update']);
            Route::delete('tariffs/{id}', [TariffController::class, 'destroy']);
            Route::patch('billing-periods/{id}/close', [BillingPeriodController::class, 'closePeriod']);
        });

        Route::middleware(['role:super_admin,admin_desa,ketua_kpspams,admin_kpspams'])->group(function () {
            Route::post('billing-periods', [BillingPeriodController::class, 'store']);
            Route::put('billing-periods/{id}', [BillingPeriodController::class, 'update']);
            Route::post('billing-periods/{id}/generate-invoices', [BillingPeriodController::class, 'generateInvoices']);
        });
        Route::get('billing-periods', [BillingPeriodController::class, 'index']);
        Route::get('billing-periods/{id}', [BillingPeriodController::class, 'show']);

        // Invoice, Pembayaran, Kwitansi, & Tunggakan
        Route::get('invoices/{id}/pdf', [InvoiceController::class, 'downloadPdf']);
        Route::get('invoices', [InvoiceController::class, 'index']);
        Route::get('invoices/{id}', [InvoiceController::class, 'show']);
        Route::get('arrears', [InvoiceController::class, 'arrears'])
            ->middleware('role:super_admin,admin_desa,pemerintah_desa,ketua_kpspams,admin_kpspams,bendahara_kpspams');

        Route::middleware(['role:super_admin,admin_desa,bendahara_kpspams'])->group(function () {
            Route::post('payments', [PaymentController::class, 'store']);
            Route::post('payments/{id}/void', [PaymentController::class, 'voidToday']);
            Route::post('payments/{id}/request-reversal', [PaymentController::class, 'requestReversal']);
        });
        Route::post('payment-reversals/{id}/approve', [PaymentController::class, 'approveReversal'])
            ->middleware('role:super_admin,admin_desa,ketua_kpspams');
        Route::get('payments/{id}/receipt-pdf', [PaymentController::class, 'receiptPdf']);
        Route::get('payments', [PaymentController::class, 'index']);
        Route::get('payments/{id}', [PaymentController::class, 'show']);

        // Pengaduan & Work Order
        Route::patch('complaints/{id}/verify', [ComplaintController::class, 'verify'])
            ->middleware('role:super_admin,admin_desa,ketua_kpspams,admin_kpspams');
        Route::post('complaints/{id}/create-work-order', [ComplaintController::class, 'createWorkOrder'])
            ->middleware('role:super_admin,admin_desa,ketua_kpspams,admin_kpspams');
        Route::get('complaints', [ComplaintController::class, 'index']);
        Route::get('complaints/{id}', [ComplaintController::class, 'show']);
        Route::post('complaints', [ComplaintController::class, 'store']);
        Route::put('complaints/{id}', [ComplaintController::class, 'update']);

        Route::middleware(['role:super_admin,admin_desa,ketua_kpspams,admin_kpspams'])->group(function () {
            Route::post('work-orders', [WorkOrderController::class, 'store']);
        });
        Route::middleware(['role:super_admin,admin_desa,petugas_lapangan'])->group(function () {
            Route::patch('work-orders/{id}/start', [WorkOrderController::class, 'start']);
            Route::post('work-orders/{id}/complete', [WorkOrderController::class, 'complete']);
        });
        Route::get('work-orders', [WorkOrderController::class, 'index']);
        Route::get('work-orders/{id}', [WorkOrderController::class, 'show']);

        // Aset & Pemeliharaan
        Route::middleware(['role:super_admin,admin_desa,ketua_kpspams,admin_kpspams'])->group(function () {
            Route::post('assets/{id}/maintenance', [AssetController::class, 'logMaintenance']);
            Route::post('assets', [AssetController::class, 'store']);
            Route::put('assets/{id}', [AssetController::class, 'update']);
            Route::delete('assets/{id}', [AssetController::class, 'destroy']);
        });
        Route::get('assets', [AssetController::class, 'index']);
        Route::get('assets/{id}', [AssetController::class, 'show']);

        // Inventaris Material
        Route::get('inventory', [InventoryController::class, 'index'])
            ->middleware('role:super_admin,admin_desa,pemerintah_desa,ketua_kpspams,admin_kpspams,petugas_lapangan');
        Route::post('inventory/transactions', [InventoryController::class, 'storeTransaction'])
            ->middleware('role:super_admin,admin_desa,ketua_kpspams,admin_kpspams');

        // Keuangan & Kas
        Route::middleware(['role:super_admin,admin_desa,pemerintah_desa,ketua_kpspams,bendahara_kpspams'])->group(function () {
            Route::get('finance/cash-accounts', [FinanceController::class, 'cashAccounts']);
            Route::get('finance/transactions', [FinanceController::class, 'transactions']);
        });
        Route::middleware(['role:super_admin,admin_desa,ketua_kpspams,bendahara_kpspams'])->group(function () {
            Route::post('finance/cash-accounts', [FinanceController::class, 'storeCashAccount']);
            Route::post('finance/cash-accounts/{id}/opening-balance', [FinanceController::class, 'setOpeningBalance']);
        });
        Route::middleware(['role:super_admin,admin_desa,bendahara_kpspams'])->group(function () {
            Route::post('finance/transactions', [FinanceController::class, 'storeTransaction']);
            Route::post('finance/transfer', [FinanceController::class, 'transfer']);
        });

        // Dashboard & Pelaporan
        Route::get('dashboard/overview', [DashboardController::class, 'overview'])
            ->middleware('role:super_admin,admin_desa,pemerintah_desa,ketua_kpspams,admin_kpspams,bendahara_kpspams,petugas_lapangan');
        Route::middleware(['role:super_admin,admin_desa,pemerintah_desa,ketua_kpspams,admin_kpspams,bendahara_kpspams'])->group(function () {
            Route::get('reports/water-consumption', [ReportController::class, 'waterConsumption']);
            Route::get('reports/billing-collection', [ReportController::class, 'billingCollection']);
            Route::get('reports/arrears-aging', [ReportController::class, 'arrearsAging']);
            Route::get('reports/cash-flow', [ReportController::class, 'cashFlow']);
            Route::get('reports/export-pdf', [ReportController::class, 'exportPdf']);
            Route::get('reports/export-excel', [ReportController::class, 'exportExcel']);
        });

        // Audit Log & Notifikasi
        Route::get('audit-logs', [AuditLogController::class, 'index'])
            ->middleware('role:super_admin,admin_desa,pemerintah_desa,ketua_kpspams');
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    });
});
