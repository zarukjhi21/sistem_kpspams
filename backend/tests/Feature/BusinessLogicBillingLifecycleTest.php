<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Desa;
use App\Models\Dusun;
use App\Models\Kpspams;
use App\Models\Customer;
use App\Models\CustomerType;
use App\Models\Connection;
use App\Models\Meter;
use App\Models\BillingPeriod;
use App\Models\MeterReading;
use App\Models\Tariff;
use App\Models\TariffComponent;
use App\Models\KpspamsBillingPolicy;
use App\Models\CashAccount;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentReversal;
use App\Models\User;
use App\Models\Role;
use App\Models\FinancialTransaction;
use App\Models\AuditLog;
use App\Services\BillingEngineService;
use App\Services\MeterAnomalyService;
use App\Services\PaymentProcessingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

class BusinessLogicBillingLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected Desa $desa;
    protected Dusun $dusun;
    protected Kpspams $kpspams;
    protected CustomerType $customerType;
    protected Customer $customer;
    protected Meter $meter;
    protected Connection $connection;
    protected User $cashier;
    protected User $supervisor;
    protected CashAccount $cashAccount;
    protected Tariff $tariff;
    protected BillingPeriod $period;
    protected KpspamsBillingPolicy $billingPolicy;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'super_admin', 'display_name' => 'Super Admin', 'scope_level' => 'GLOBAL']);
        Role::create(['name' => 'admin_desa', 'display_name' => 'Admin Desa', 'scope_level' => 'DESA']);
        Role::create(['name' => 'ketua_kpspams', 'display_name' => 'Ketua KPSPAMS', 'scope_level' => 'KPSPAMS']);
        Role::create(['name' => 'bendahara_kpspams', 'display_name' => 'Bendahara KPSPAMS', 'scope_level' => 'KPSPAMS']);
        Role::create(['name' => 'admin_kpspams', 'display_name' => 'Admin KPSPAMS', 'scope_level' => 'KPSPAMS']);
        Role::create(['name' => 'petugas_lapangan', 'display_name' => 'Petugas Lapangan', 'scope_level' => 'KPSPAMS']);
        Role::create(['name' => 'pelanggan', 'display_name' => 'Pelanggan', 'scope_level' => 'OWN_CUSTOMER']);

        $this->desa = Desa::create([
            'code' => '7604012001',
            'name' => 'Kuajang',
            'subdistrict' => 'Binuang',
            'district' => 'Polewali Mandar',
            'province' => 'Sulawesi Barat',
        ]);

        $this->dusun = Dusun::create([
            'desa_id' => $this->desa->id,
            'code' => 'DS-LMB',
            'name' => 'Lemo Baru',
        ]);

        $this->kpspams = Kpspams::create([
            'desa_id' => $this->desa->id,
            'code' => 'KP-LMB',
            'name' => 'KPSPAMS Lemo Baru',
        ]);

        DB::table('kpspams_dusun')->insert([
            'kpspams_id' => $this->kpspams->id,
            'dusun_id' => $this->dusun->id,
            'is_primary' => true,
            'created_at' => now(),
        ]);

        $this->customerType = CustomerType::create(['code' => 'R1', 'name' => 'Rumah Tangga']);

        $this->customer = Customer::create([
            'kpspams_id' => $this->kpspams->id,
            'customer_type_id' => $this->customerType->id,
            'code' => 'CUST-LMB-001',
            'nik' => '7604010101900001',
            'full_name' => 'Pak Ahmad',
            'phone' => '081234567890',
            'identity_address' => 'Dusun Lemo Baru RT 01',
        ]);

        $this->meter = Meter::create([
            'kpspams_id' => $this->kpspams->id,
            'serial_number' => 'MTR-LMB-001',
            'brand' => 'Onda',
            'initial_reading' => 10.00,
            'status' => 'ACTIVE',
        ]);

        $this->connection = Connection::create([
            'kpspams_id' => $this->kpspams->id,
            'customer_id' => $this->customer->id,
            'dusun_id' => $this->dusun->id,
            'meter_id' => $this->meter->id,
            'connection_no' => 'SR-KP01-00001',
            'address_detail' => 'Rumah Pak Ahmad RT 01',
            'status' => 'ACTIVE',
        ]);

        $this->cashAccount = CashAccount::create([
            'kpspams_id' => $this->kpspams->id,
            'account_code' => 'KAS-LMB-01',
            'account_name' => 'Kas Tunai Lemo Baru',
            'opening_balance' => 100000.00,
            'current_balance' => 100000.00,
            'is_active' => true,
        ]);

        $this->cashier = User::create([
            'kpspams_id' => $this->kpspams->id,
            'name' => 'Bendahara LMB',
            'username' => 'bendahara_lmb',
            'phone' => '0811111111',
            'password' => 'secret123',
        ]);
        $this->cashier->roles()->attach(Role::where('name', 'bendahara_kpspams')->first()->id);

        $this->supervisor = User::create([
            'kpspams_id' => $this->kpspams->id,
            'name' => 'Ketua LMB',
            'username' => 'ketua_lmb',
            'phone' => '0822222222',
            'password' => 'secret123',
        ]);
        $this->supervisor->roles()->attach(Role::where('name', 'ketua_kpspams')->first()->id);

        // Skema Tarif Bertingkat (Progressive Tier)
        $this->tariff = Tariff::create([
            'kpspams_id' => $this->kpspams->id,
            'customer_type_id' => $this->customerType->id,
            'name' => 'Tarif Rumah Tangga Lemo Baru 2026',
            'effective_from' => '2026-01-01',
            'effective_until' => null,
            'fixed_admin_fee' => 5000.00,
            'maintenance_fee' => 2000.00,
            'status' => 'ACTIVE',
        ]);

        TariffComponent::create([
            'tariff_id' => $this->tariff->id,
            'tier_order' => 1,
            'tier_min_m3' => 0,
            'tier_max_m3' => 10,
            'rate_per_m3' => 1500.00,
        ]);
        TariffComponent::create([
            'tariff_id' => $this->tariff->id,
            'tier_order' => 2,
            'tier_min_m3' => 11,
            'tier_max_m3' => 20,
            'rate_per_m3' => 2500.00,
        ]);
        TariffComponent::create([
            'tariff_id' => $this->tariff->id,
            'tier_order' => 3,
            'tier_min_m3' => 21,
            'tier_max_m3' => null,
            'rate_per_m3' => 3500.00,
        ]);

        $this->billingPolicy = KpspamsBillingPolicy::create([
            'kpspams_id' => $this->kpspams->id,
            'due_date_day' => 20,
            'late_penalty_type' => 'FLAT',
            'late_penalty_amount' => 0.00, // MVP Default Rp0
            'sp1_arrears_months' => 1,
            'sp2_arrears_months' => 2,
            'disconnect_recommendation_months' => 3,
            'reconnect_fee' => 0.00,
        ]);

        $this->period = BillingPeriod::create([
            'kpspams_id' => $this->kpspams->id,
            'period_code' => '202610',
            'name' => 'Oktober 2026',
            'year' => 2026,
            'month' => 10,
            'reading_start_date' => '2026-10-01',
            'reading_end_date' => '2026-10-05',
            'billing_date' => '2026-10-06',
            'due_date' => '2026-10-20',
            'status' => 'OPEN',
        ]);
    }

    /**
     * Verifikasi 1: Perhitungan Pemakaian & Deteksi Anomali Stand Meter
     */
    public function test_meter_reading_previous_and_current_calculation(): void
    {
        $anomalyService = new MeterAnomalyService();

        // 1. Reading pertama: Stand awal diambil dari meter->initial_reading (10.0), stand akhir 25.0
        $eval1 = $anomalyService->evaluateReading($this->connection, (float) $this->meter->initial_reading, 25.00);
        $this->assertEquals('VERIFIED', $eval1['status']);
        $this->assertEquals(15.00, $eval1['usage_m3']);

        $reading1 = MeterReading::create([
            'kpspams_id' => $this->kpspams->id,
            'billing_period_id' => $this->period->id,
            'connection_id' => $this->connection->id,
            'meter_id' => $this->meter->id,
            'reading_date' => '2026-10-02',
            'previous_reading' => (float) $this->meter->initial_reading,
            'current_reading' => 25.00,
            'usage_m3' => $eval1['usage_m3'],
            'meter_photo_path' => 'meter_photos/test.jpg',
            'status' => 'VERIFIED',
        ]);

        // 2. Reading anomali stand mundur (Rollback): sebelumnya 25.0, dicatat 20.0
        $evalRollback = $anomalyService->evaluateReading($this->connection, 25.00, 20.00);
        $this->assertEquals('ANOMALY_ROLLBACK', $evalRollback['status']);
        $this->assertEquals(0.00, $evalRollback['usage_m3']);
        $this->assertStringContainsString('lebih kecil', $evalRollback['message']);
    }

    /**
     * Verifikasi 2: Invoice Generation & Immutability Tarif
     */
    public function test_invoice_generation_locks_snapshot_and_items(): void
    {
        $reading = MeterReading::create([
            'kpspams_id' => $this->kpspams->id,
            'billing_period_id' => $this->period->id,
            'connection_id' => $this->connection->id,
            'meter_id' => $this->meter->id,
            'reading_date' => '2026-10-02',
            'previous_reading' => 10.00,
            'current_reading' => 35.00,
            'usage_m3' => 25.00, // 25 m³
            'meter_photo_path' => 'meter_photos/test.jpg',
            'status' => 'VERIFIED',
        ]);

        $billingService = new BillingEngineService();
        $invoice = $billingService->generateInvoice($this->connection, $this->period, $reading);

        // Perhitungan:
        // Tier 1 (0-10 m³ @ 1.500) = 15.000
        // Tier 2 (11-20 m³ @ 2.500) = 25.000
        // Tier 3 (21-25 m³ @ 3.500, volume 5 m³) = 17.500
        // Subtotal air = 57.500
        // Admin fee = 5.000
        // Maintenance fee = 2.000
        // Total = 64.500
        $this->assertEquals(57500.00, $invoice->water_amount);
        $this->assertEquals(5000.00, $invoice->admin_fee);
        $this->assertEquals(2000.00, $invoice->maintenance_fee);
        $this->assertEquals(64500.00, $invoice->total_amount);
        $this->assertEquals(64500.00, $invoice->balance_due);
        $this->assertEquals('UNPAID', $invoice->status);

        // Verifikasi Snapshot Items
        $this->assertCount(5, $invoice->items); // 3 tier + 1 admin + 1 maintenance

        // Uji Immutability: Mengubah tarif master di database
        $this->tariff->update(['fixed_admin_fee' => 999999.00]);

        // Tagihan yang sudah diterbitkan TIDAK BOLEH BERUBAH
        $freshInvoice = $invoice->fresh();
        $this->assertEquals(64500.00, $freshInvoice->total_amount);
        $this->assertEquals(5000.00, $freshInvoice->admin_fee);
    }

    /**
     * Verifikasi 3: Partial Payment, Full Payment, & Overpayment Rejection
     */
    public function test_partial_payment_full_payment_and_overpayment(): void
    {
        $reading = MeterReading::create([
            'kpspams_id' => $this->kpspams->id,
            'billing_period_id' => $this->period->id,
            'connection_id' => $this->connection->id,
            'meter_id' => $this->meter->id,
            'reading_date' => '2026-10-02',
            'previous_reading' => 10.00,
            'current_reading' => 20.00,
            'usage_m3' => 10.00, // 10 m³ x 1.500 = 15.000 + 5.000 + 2.000 = 22.000
            'meter_photo_path' => 'meter_photos/test.jpg',
            'status' => 'VERIFIED',
        ]);

        $billingService = new BillingEngineService();
        $invoice = $billingService->generateInvoice($this->connection, $this->period, $reading);
        $this->assertEquals(22000.00, $invoice->total_amount);

        $paymentService = new PaymentProcessingService();

        // 1. Partial Payment (Rp 10.000)
        $payment1 = $paymentService->processPayment(
            $invoice,
            10000.00,
            $this->cashAccount->id,
            $this->cashier->id,
            'CASH'
        );

        $this->assertEquals(10000.00, $payment1->amount_paid);
        $inv1 = $invoice->fresh();
        $this->assertEquals('PARTIALLY_PAID', $inv1->status);
        $this->assertEquals(10000.00, $inv1->paid_amount);
        $this->assertEquals(12000.00, $inv1->balance_due);
        $this->assertNull($inv1->paid_at);

        // 2. Overpayment Rejection (Mencoba bayar 15.000 padahal sisa tagihan 12.000)
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('melebihi sisa tagihan');
        $paymentService->processPayment(
            $inv1,
            15000.00,
            $this->cashAccount->id,
            $this->cashier->id,
            'CASH'
        );
    }

    /**
     * Verifikasi 4: Pelunasan Penuh (Full Payment) & Mutasi Saldo Kas
     */
    public function test_full_payment_completes_invoice_and_updates_cash(): void
    {
        $reading = MeterReading::create([
            'kpspams_id' => $this->kpspams->id,
            'billing_period_id' => $this->period->id,
            'connection_id' => $this->connection->id,
            'meter_id' => $this->meter->id,
            'reading_date' => '2026-10-02',
            'previous_reading' => 10.00,
            'current_reading' => 20.00,
            'usage_m3' => 10.00,
            'meter_photo_path' => 'meter_photos/test.jpg',
            'status' => 'VERIFIED',
        ]);

        $billingService = new BillingEngineService();
        $invoice = $billingService->generateInvoice($this->connection, $this->period, $reading);

        $paymentService = new PaymentProcessingService();
        $initialBalance = (float) $this->cashAccount->current_balance;

        // Bayar lunas (Rp 22.000)
        $payment = $paymentService->processPayment(
            $invoice,
            22000.00,
            $this->cashAccount->id,
            $this->cashier->id,
            'CASH'
        );

        $inv = $invoice->fresh();
        $this->assertEquals('PAID', $inv->status);
        $this->assertEquals(22000.00, $inv->paid_amount);
        $this->assertEquals(0.00, $inv->balance_due);
        $this->assertNotNull($inv->paid_at);

        // Saldo kas bertambah tepat 22.000
        $this->assertEquals($initialBalance + 22000.00, (float) $this->cashAccount->fresh()->current_balance);

        // Mutasi tercatat di financial_transactions
        $tx = FinancialTransaction::where('reference_id', $payment->id)->first();
        $this->assertNotNull($tx);
        $this->assertEquals('INCOME', $tx->transaction_type);
        $this->assertEquals(22000.00, (float) $tx->amount);
    }

    /**
     * Verifikasi 5: VOID (T+0) & Audit Trail
     */
    public function test_void_same_day_restores_invoice_and_logs_audit(): void
    {
        $reading = MeterReading::create([
            'kpspams_id' => $this->kpspams->id,
            'billing_period_id' => $this->period->id,
            'connection_id' => $this->connection->id,
            'meter_id' => $this->meter->id,
            'reading_date' => '2026-10-02',
            'previous_reading' => 10.00,
            'current_reading' => 20.00,
            'usage_m3' => 10.00,
            'meter_photo_path' => 'meter_photos/test.jpg',
            'status' => 'VERIFIED',
        ]);

        $billingService = new BillingEngineService();
        $invoice = $billingService->generateInvoice($this->connection, $this->period, $reading);

        $paymentService = new PaymentProcessingService();
        $payment = $paymentService->processPayment($invoice, 22000.00, $this->cashAccount->id, $this->cashier->id);

        // Eksekusi VOID pada hari yang sama (T+0)
        $paymentService->voidPayment($payment, $this->cashier->id, 'Warga salah bawa uang');

        // Payment status menjadi VOIDED
        $this->assertEquals('VOIDED', $payment->fresh()->status);

        // Invoice harus kembali UNPAID
        $inv = $invoice->fresh();
        $this->assertEquals('UNPAID', $inv->status);
        $this->assertEquals(0.00, $inv->paid_amount);
        $this->assertEquals(22000.00, $inv->balance_due);

        // Audit Log tercatat
        $audit = AuditLog::where('action', 'VOID_PAYMENT')->where('entity_id', $payment->id)->first();
        $this->assertNotNull($audit);
    }

    /**
     * Verifikasi 6: Arrears & Aging Evaluation (SP1, SP2, Rekomendasi Putus)
     */
    public function test_arrears_aging_evaluation(): void
    {
        $this->actingAs($this->supervisor);

        // Buat 3 invoice tak berbayar untuk sambungan yang sama
        for ($i = 1; $i <= 3; $i++) {
            $period = BillingPeriod::create([
                'kpspams_id' => $this->kpspams->id,
                'period_code' => "20260{$i}",
                'name' => "Bulan {$i}",
                'year' => 2026,
                'month' => $i,
                'reading_start_date' => "2026-0{$i}-01",
                'reading_end_date' => "2026-0{$i}-05",
                'billing_date' => "2026-0{$i}-06",
                'due_date' => "2026-0{$i}-20",
                'status' => 'BILLED',
            ]);

            $reading = MeterReading::create([
                'kpspams_id' => $this->kpspams->id,
                'billing_period_id' => $period->id,
                'connection_id' => $this->connection->id,
                'meter_id' => $this->meter->id,
                'reading_date' => "2026-0{$i}-02",
                'previous_reading' => (float) (10 * $i),
                'current_reading' => (float) (10 * $i + 10),
                'usage_m3' => 10.00,
                'meter_photo_path' => "meter_photos/test_{$i}.jpg",
                'status' => 'VERIFIED',
            ]);

            Invoice::create([
                'kpspams_id' => $this->kpspams->id,
                'billing_period_id' => $period->id,
                'meter_reading_id' => $reading->id,
                'connection_id' => $this->connection->id,
                'customer_id' => $this->customer->id,
                'invoice_number' => "INV/20260{$i}/KP01/000{$i}",
                'invoice_date' => "2026-0{$i}-06",
                'due_date' => "2026-0{$i}-20",
                'usage_m3' => 10.00,
                'water_amount' => 15000.00,
                'admin_fee' => 5000.00,
                'maintenance_fee' => 2000.00,
                'penalty_fee' => 0.00,
                'total_amount' => 22000.00,
                'paid_amount' => 0.00,
                'balance_due' => 22000.00,
                'status' => 'UNPAID',
            ]);
        }

        $res = $this->getJson('/api/v1/arrears');
        $res->assertStatus(200);

        $records = $res->json('data.records');
        $this->assertNotEmpty($records);

        $connRecord = collect($records)->firstWhere('connection_id', $this->connection->id);
        $this->assertNotNull($connRecord);
        $this->assertEquals(3, $connRecord['unpaid_months_count']);
        $this->assertEquals(66000.00, (float) $connRecord['total_arrears_amount']);
        // 3 bulan tunggakan sesuai ambang batas disconnect_recommendation_months = 3 -> REKOMENDASI_PUTUS
        $this->assertEquals('REKOMENDASI_PUTUS', $connRecord['status_notice']);
    }
}
