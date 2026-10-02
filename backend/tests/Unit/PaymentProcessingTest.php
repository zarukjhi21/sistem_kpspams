<?php

declare(strict_types=1);

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\CashAccount;
use App\Models\FinancialTransaction;
use App\Models\PaymentReversal;
use App\Models\User;
use App\Models\BillingPeriod;
use App\Models\Connection;
use App\Services\PaymentProcessingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Exception;

class PaymentProcessingTest extends TestCase
{
    use RefreshDatabase;

    protected PaymentProcessingService $service;
    protected User $cashier;
    protected User $supervisor;
    protected CashAccount $cashAccount;
    protected Invoice $invoice;

    protected function setUp(): void
    {
        parent::setUp();

        // Jalankan seluruh seeder resmi
        $this->seed();

        $this->service = new PaymentProcessingService();

        $this->cashier = User::where('username', 'bendahara.lemobaru')->firstOrFail();
        $this->supervisor = User::where('username', 'ketua.lemobaru')->firstOrFail();
        $this->cashAccount = CashAccount::where('kpspams_id', 1)->where('account_code', 'KAS-LMB-TUNAI')->firstOrFail();
        $connection = Connection::where('kpspams_id', 1)->firstOrFail();

        $period = BillingPeriod::create([
            'kpspams_id' => 1,
            'period_code' => 'PER-202610-LB',
            'name' => 'Oktober 2026',
            'year' => 2026,
            'month' => 10,
            'reading_start_date' => '2026-10-01',
            'reading_end_date' => '2026-10-04',
            'billing_date' => '2026-10-05',
            'due_date' => '2026-10-20',
            'status' => 'BILLING',
        ]);

        $reading = \App\Models\MeterReading::create([
            'kpspams_id' => 1,
            'connection_id' => $connection->id,
            'meter_id' => $connection->meter_id,
            'billing_period_id' => $period->id,
            'reading_date' => '2026-10-02',
            'previous_reading' => 0.0,
            'current_reading' => 10.0,
            'usage_m3' => 10.0,
            'meter_photo_path' => 'meter_readings/202610/test.jpg',
            'status' => 'VERIFIED',
        ]);

        $this->invoice = Invoice::create([
            'kpspams_id' => 1,
            'billing_period_id' => $period->id,
            'connection_id' => $connection->id,
            'customer_id' => $connection->customer_id,
            'meter_reading_id' => $reading->id,
            'invoice_number' => 'INV/202610/KP01/TEST01',
            'invoice_date' => '2026-10-05',
            'due_date' => '2026-10-20',
            'usage_m3' => 10.0,
            'water_amount' => 0.0,
            'admin_fee' => 10000.0,
            'maintenance_fee' => 0.0,
            'penalty_fee' => 0.0,
            'total_amount' => 10000.0,
            'paid_amount' => 0.0,
            'balance_due' => 10000.0,
            'status' => 'UNPAID',
        ]);
    }

    public function test_it_successfully_processes_atomic_payment(): void
    {
        $payment = $this->service->processPayment(
            $this->invoice,
            10000.0,
            $this->cashAccount->id,
            $this->cashier->id,
            'CASH'
        );

        $this->assertEquals('SUCCESS', $payment->status);
        $this->assertEquals(10000.0, $payment->amount_paid);

        // Verifikasi invoice lunas
        $freshInvoice = $this->invoice->fresh();
        $this->assertEquals('PAID', $freshInvoice->status);
        $this->assertEquals(10000.0, $freshInvoice->paid_amount);
        $this->assertEquals(0.0, $freshInvoice->balance_due);
        $this->assertNotNull($freshInvoice->paid_at);

        // Verifikasi saldo kas bertambah
        $freshAccount = $this->cashAccount->fresh();
        $this->assertEquals(10000.0, $freshAccount->current_balance);

        // Verifikasi mutasi transaksi keuangan
        $tx = FinancialTransaction::where('reference_id', $payment->id)->first();
        $this->assertNotNull($tx);
        $this->assertEquals('INCOME', $tx->transaction_type);
        $this->assertEquals(10000.0, $tx->amount);
    }

    public function test_it_rejects_overpayment(): void
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('melebihi sisa tagihan');

        $this->service->processPayment(
            $this->invoice,
            50000.0, // Invoice hanya 10.000
            $this->cashAccount->id,
            $this->cashier->id
        );
    }

    public function test_it_successfully_voids_same_day_payment(): void
    {
        $payment = $this->service->processPayment(
            $this->invoice,
            10000.0,
            $this->cashAccount->id,
            $this->cashier->id
        );

        // Void pembayaran pada hari yang sama
        $this->service->voidPayment($payment, $this->cashier->id, 'Salah input uang pecahan');

        $freshPayment = $payment->fresh();
        $this->assertEquals('VOIDED', $freshPayment->status);

        // Invoice harus kembali UNPAID
        $freshInvoice = $this->invoice->fresh();
        $this->assertEquals('UNPAID', $freshInvoice->status);
        $this->assertEquals(0.0, $freshInvoice->paid_amount);
        $this->assertEquals(10000.0, $freshInvoice->balance_due);
        $this->assertNull($freshInvoice->paid_at);

        // Saldo kas harus kembali 0
        $freshAccount = $this->cashAccount->fresh();
        $this->assertEquals(0.0, $freshAccount->current_balance);

        // Catatan mutasi pengurang kas
        $voidTx = FinancialTransaction::where('reference_type', 'PAYMENT_VOID')
            ->where('reference_id', $payment->id)
            ->first();
        $this->assertNotNull($voidTx);
        $this->assertEquals('EXPENSE', $voidTx->transaction_type);
    }

    public function test_it_rejects_void_for_different_day_payment(): void
    {
        $payment = $this->service->processPayment(
            $this->invoice,
            10000.0,
            $this->cashAccount->id,
            $this->cashier->id
        );

        // Simulasikan transaksi kemarin (T-2)
        $payment->payment_date = now()->subDays(2);
        $payment->save();

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('hanya diizinkan pada hari yang sama (T+0)');

        $this->service->voidPayment($payment->fresh(), $this->cashier->id, 'Ingin void transaksi 2 hari lalu');
    }

    public function test_it_handles_supervised_reversal_lifecycle(): void
    {
        $payment = $this->service->processPayment(
            $this->invoice,
            10000.0,
            $this->cashAccount->id,
            $this->cashier->id
        );

        // 1. Kasir mengajukan reversal beda hari
        $reversal = $this->service->requestReversal($payment, $this->cashier->id, 'Pelanggan melampirkan bukti transfer kliring gagal');
        $this->assertNotNull($reversal);
        $this->assertNull($reversal->approved_by);

        // 2. Ketua menyetujui reversal
        $this->service->approveReversal($reversal, $this->supervisor->id, $this->supervisor->name);

        $freshReversal = $reversal->fresh();
        $this->assertEquals($this->supervisor->id, $freshReversal->approved_by);

        // Status payment jadi REVERSED
        $freshPayment = $payment->fresh();
        $this->assertEquals('REVERSED', $freshPayment->status);

        // Invoice kembali UNPAID
        $freshInvoice = $this->invoice->fresh();
        $this->assertEquals('UNPAID', $freshInvoice->status);
        $this->assertEquals(0.0, $freshInvoice->paid_amount);

        // Saldo kas terpotong kembali ke 0
        $freshAccount = $this->cashAccount->fresh();
        $this->assertEquals(0.0, $freshAccount->current_balance);
    }
}
