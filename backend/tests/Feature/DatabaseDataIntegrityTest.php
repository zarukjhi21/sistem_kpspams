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
use App\Models\CashAccount;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use App\Models\Role;
use App\Services\BillingEngineService;
use App\Services\PaymentProcessingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Exception;

class DatabaseDataIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected Desa $desa;
    protected Kpspams $kpspams1;
    protected Kpspams $kpspams2;
    protected Dusun $dusun1;
    protected Dusun $dusun2;
    protected CustomerType $custType;
    protected Customer $customer1;
    protected Customer $customer2;
    protected Meter $meter1;
    protected Connection $conn1;
    protected BillingPeriod $period1;
    protected BillingPeriod $period2;
    protected Tariff $tariff1;
    protected CashAccount $cashAcc1;
    protected CashAccount $cashAcc2;
    protected User $user1;

    protected function setUp(): void
    {
        parent::setUp();

        $this->desa = Desa::create([
            'code' => '7604012001',
            'name' => 'Kuajang',
            'subdistrict' => 'Binuang',
            'district' => 'Polewali Mandar',
            'province' => 'Sulawesi Barat',
        ]);

        $this->dusun1 = Dusun::create([
            'desa_id' => $this->desa->id,
            'code' => 'DS01',
            'name' => 'Lemo Baru',
        ]);

        $this->dusun2 = Dusun::create([
            'desa_id' => $this->desa->id,
            'code' => 'DS02',
            'name' => 'Lemo Tua',
        ]);

        $this->kpspams1 = Kpspams::create([
            'desa_id' => $this->desa->id,
            'code' => 'KP01',
            'name' => 'KPSPAMS Lemo Baru',
        ]);

        $this->kpspams2 = Kpspams::create([
            'desa_id' => $this->desa->id,
            'code' => 'KP02',
            'name' => 'KPSPAMS Lemo Tua',
        ]);

        $this->custType = CustomerType::create([
            'code' => 'R1',
            'name' => 'Rumah Tangga',
        ]);

        $this->customer1 = Customer::create([
            'kpspams_id' => $this->kpspams1->id,
            'customer_type_id' => $this->custType->id,
            'code' => 'CUST001',
            'nik' => '7604010101900001',
            'full_name' => 'Pelanggan KPSPAMS 1',
            'phone' => '081234567891',
            'identity_address' => 'Dusun Lemo Baru',
        ]);

        $this->customer2 = Customer::create([
            'kpspams_id' => $this->kpspams2->id,
            'customer_type_id' => $this->custType->id,
            'code' => 'CUST002',
            'nik' => '7604010101900002',
            'full_name' => 'Pelanggan KPSPAMS 2',
            'phone' => '081234567892',
            'identity_address' => 'Dusun Lemo Tua',
        ]);

        $this->meter1 = Meter::create([
            'kpspams_id' => $this->kpspams1->id,
            'serial_number' => 'MTR-001',
            'brand' => 'Onda',
            'initial_reading' => 0.00,
        ]);

        $this->conn1 = Connection::create([
            'kpspams_id' => $this->kpspams1->id,
            'customer_id' => $this->customer1->id,
            'dusun_id' => $this->dusun1->id,
            'meter_id' => $this->meter1->id,
            'connection_no' => 'SR-KP01-00001',
            'address_detail' => 'RT 01',
        ]);

        $this->period1 = BillingPeriod::create([
            'kpspams_id' => $this->kpspams1->id,
            'period_code' => '202610',
            'name' => 'Oktober 2026',
            'year' => 2026,
            'month' => 10,
            'reading_start_date' => '2026-10-01',
            'reading_end_date' => '2026-10-05',
            'billing_date' => '2026-10-06',
            'due_date' => '2026-10-20',
        ]);

        $this->period2 = BillingPeriod::create([
            'kpspams_id' => $this->kpspams2->id,
            'period_code' => '202610',
            'name' => 'Oktober 2026 KP2',
            'year' => 2026,
            'month' => 10,
            'reading_start_date' => '2026-10-01',
            'reading_end_date' => '2026-10-05',
            'billing_date' => '2026-10-06',
            'due_date' => '2026-10-20',
        ]);

        $this->tariff1 = Tariff::create([
            'kpspams_id' => $this->kpspams1->id,
            'customer_type_id' => $this->custType->id,
            'name' => 'Tarif R1 2026',
            'effective_from' => '2026-01-01',
            'fixed_admin_fee' => 5000.00,
            'maintenance_fee' => 2000.00,
            'status' => 'ACTIVE',
        ]);

        TariffComponent::create([
            'tariff_id' => $this->tariff1->id,
            'tier_order' => 1,
            'tier_min_m3' => 0,
            'tier_max_m3' => 10,
            'rate_per_m3' => 2000.00,
        ]);

        $this->cashAcc1 = CashAccount::create([
            'kpspams_id' => $this->kpspams1->id,
            'account_code' => 'KAS-01',
            'account_name' => 'Kas Operasional KP1',
            'opening_balance' => 100000.00,
            'current_balance' => 100000.00,
        ]);

        $this->cashAcc2 = CashAccount::create([
            'kpspams_id' => $this->kpspams2->id,
            'account_code' => 'KAS-02',
            'account_name' => 'Kas Operasional KP2',
            'opening_balance' => 100000.00,
            'current_balance' => 100000.00,
        ]);

        $this->user1 = User::create([
            'kpspams_id' => $this->kpspams1->id,
            'name' => 'Petugas KP1',
            'username' => 'petugas1',
            'phone' => '08111111111',
            'password' => 'secret123',
        ]);
    }

    /**
     * Test 1: Snapshot Immutability - Perubahan tarif di kemudian hari tidak boleh mengubah invoice historis
     */
    public function test_tariff_change_does_not_mutate_historical_invoice(): void
    {
        $reading = MeterReading::create([
            'kpspams_id' => $this->kpspams1->id,
            'billing_period_id' => $this->period1->id,
            'connection_id' => $this->conn1->id,
            'meter_id' => $this->meter1->id,
            'previous_reading' => 0.00,
            'current_reading' => 10.00,
            'usage_m3' => 10.00,
            'meter_photo_path' => 'meter_photos/sample.jpg',
            'status' => 'VERIFIED',
        ]);

        $service = app(BillingEngineService::class);
        $invoice = $service->generateInvoice($this->conn1, $this->period1, $reading);

        $initialTotal = $invoice->total_amount; // 10 * 2000 + 5000 + 2000 = 27000
        $this->assertEquals(27000.00, (float) $initialTotal);

        // Ubah tarif aktif
        $this->tariff1->update(['fixed_admin_fee' => 15000.00]);
        TariffComponent::where('tariff_id', $this->tariff1->id)->update(['rate_per_m3' => 5000.00]);

        // Invoice historis harus tetap 27000
        $freshInvoice = Invoice::find($invoice->id);
        $this->assertEquals(27000.00, (float) $freshInvoice->total_amount);
        $this->assertEquals(5000.00, (float) $freshInvoice->admin_fee);
    }

    /**
     * Test 2: Meter tidak bisa dipasangkan ke sambungan lain secara bersamaan (Unique Constraint)
     */
    public function test_meter_cannot_be_reused_by_another_active_connection(): void
    {
        $this->expectException(\Illuminate\Database\QueryException::class);

        Connection::create([
            'kpspams_id' => $this->kpspams1->id,
            'customer_id' => $this->customer1->id,
            'dusun_id' => $this->dusun1->id,
            'meter_id' => $this->meter1->id, // Duplikasi meter_id
            'connection_no' => 'SR-KP01-00002',
            'address_detail' => 'RT 02',
        ]);
    }

    /**
     * Test 3: Duplicate Reading pada periode yang sama dicegah oleh database unique constraint
     */
    public function test_duplicate_meter_reading_in_same_period_is_rejected(): void
    {
        MeterReading::create([
            'kpspams_id' => $this->kpspams1->id,
            'billing_period_id' => $this->period1->id,
            'connection_id' => $this->conn1->id,
            'meter_id' => $this->meter1->id,
            'previous_reading' => 0.00,
            'current_reading' => 10.00,
            'usage_m3' => 10.00,
            'meter_photo_path' => 'meter_photos/sample.jpg',
            'status' => 'VERIFIED',
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        // Percobaan catat meter kedua untuk connection dan period yang sama
        MeterReading::create([
            'kpspams_id' => $this->kpspams1->id,
            'billing_period_id' => $this->period1->id,
            'connection_id' => $this->conn1->id,
            'meter_id' => $this->meter1->id,
            'previous_reading' => 10.00,
            'current_reading' => 15.00,
            'usage_m3' => 5.00,
            'meter_photo_path' => 'meter_photos/sample2.jpg',
            'status' => 'PENDING',
        ]);
    }

    /**
     * Test 4: Cross-tenant invoice generation rejection
     */
    public function test_invoice_cannot_cross_kpspams_tenant_scope(): void
    {
        $reading = MeterReading::create([
            'kpspams_id' => $this->kpspams1->id,
            'billing_period_id' => $this->period1->id,
            'connection_id' => $this->conn1->id,
            'meter_id' => $this->meter1->id,
            'previous_reading' => 0.00,
            'current_reading' => 10.00,
            'usage_m3' => 10.00,
            'meter_photo_path' => 'meter_photos/sample.jpg',
            'status' => 'VERIFIED',
        ]);

        $service = app(BillingEngineService::class);

        // Percobaan menerbitkan invoice dengan period2 milik KPSPAMS 2
        $this->expectException(Exception::class);
        $this->expectExceptionMessageMatches('/tidak cocok|scope|tenant|KPSPAMS/i');

        $service->generateInvoice($this->conn1, $this->period2, $reading);
    }

    /**
     * Test 5: Cross-tenant payment rejection
     */
    public function test_payment_cannot_credit_cash_account_of_different_kpspams(): void
    {
        $reading = MeterReading::create([
            'kpspams_id' => $this->kpspams1->id,
            'billing_period_id' => $this->period1->id,
            'connection_id' => $this->conn1->id,
            'meter_id' => $this->meter1->id,
            'previous_reading' => 0.00,
            'current_reading' => 10.00,
            'usage_m3' => 10.00,
            'meter_photo_path' => 'meter_photos/sample.jpg',
            'status' => 'VERIFIED',
        ]);

        $billingService = app(BillingEngineService::class);
        $invoice = $billingService->generateInvoice($this->conn1, $this->period1, $reading);

        $paymentService = app(PaymentProcessingService::class);

        // Percobaan membayar invoice KP1 dengan cash account KP2 ($this->cashAcc2)
        $this->expectException(Exception::class);
        $this->expectExceptionMessageMatches('/lingkup KPSPAMS|tidak valid|scope/i');

        $paymentService->processPayment($invoice, 27000.00, $this->cashAcc2->id, $this->user1->id);
    }

    /**
     * Test 6: VOID tidak boleh menyebabkan saldo kas menjadi negatif secara tidak valid
     */
    public function test_void_payment_cannot_result_in_negative_cash_balance(): void
    {
        $reading = MeterReading::create([
            'kpspams_id' => $this->kpspams1->id,
            'billing_period_id' => $this->period1->id,
            'connection_id' => $this->conn1->id,
            'meter_id' => $this->meter1->id,
            'previous_reading' => 0.00,
            'current_reading' => 10.00,
            'usage_m3' => 10.00,
            'meter_photo_path' => 'meter_photos/sample.jpg',
            'status' => 'VERIFIED',
        ]);

        $billingService = app(BillingEngineService::class);
        $invoice = $billingService->generateInvoice($this->conn1, $this->period1, $reading);

        $paymentService = app(PaymentProcessingService::class);
        $payment = $paymentService->processPayment($invoice, 27000.00, $this->cashAcc1->id, $this->user1->id);

        // Simulasikan penarikan saldo kas sehingga tersisa hanya Rp 5.000 (kurang dari Rp 27.000 yang akan di-void)
        $this->cashAcc1->update(['current_balance' => 5000.00]);

        $this->expectException(Exception::class);
        $this->expectExceptionMessageMatches('/tidak mencukupi|negatif/i');

        $paymentService->voidPayment($payment, $this->user1->id, 'Uji coba void saat kas tidak cukup');
    }

    /**
     * Test 7: Akses connection_number dan query builder harus kompatibel
     */
    public function test_connection_number_attribute_and_query_compatibility(): void
    {
        $conn = Connection::find($this->conn1->id);
        $this->assertEquals('SR-KP01-00001', $conn->connection_no);
        $this->assertEquals('SR-KP01-00001', $conn->connection_number);
    }

    /**
     * Test 8: Mencegah duplikasi tagihan pada sambungan dan periode yang sama
     */
    public function test_duplicate_invoice_for_same_period_and_connection_is_rejected(): void
    {
        $r1 = MeterReading::create([
            'kpspams_id' => $this->kpspams1->id,
            'billing_period_id' => $this->period1->id,
            'connection_id' => $this->conn1->id,
            'meter_id' => $this->meter1->id,
            'previous_reading' => 0.00,
            'current_reading' => 10.00,
            'usage_m3' => 10.00,
            'meter_photo_path' => 'meter_photos/sample.jpg',
            'status' => 'VERIFIED',
        ]);

        $meter2 = Meter::create([
            'kpspams_id' => $this->kpspams1->id,
            'serial_number' => 'MTR-002',
            'brand' => 'Onda',
            'initial_reading' => 0.00,
        ]);

        $conn2 = Connection::create([
            'kpspams_id' => $this->kpspams1->id,
            'customer_id' => $this->customer1->id,
            'dusun_id' => $this->dusun1->id,
            'meter_id' => $meter2->id,
            'connection_no' => 'SR-KP01-00002',
            'address_detail' => 'RT 02',
        ]);

        $r2 = MeterReading::create([
            'kpspams_id' => $this->kpspams1->id,
            'billing_period_id' => $this->period1->id,
            'connection_id' => $conn2->id,
            'meter_id' => $meter2->id,
            'previous_reading' => 0.00,
            'current_reading' => 5.00,
            'usage_m3' => 5.00,
            'meter_photo_path' => 'meter_photos/sample2.jpg',
            'status' => 'VERIFIED',
        ]);

        Invoice::create([
            'kpspams_id' => $this->kpspams1->id,
            'billing_period_id' => $this->period1->id,
            'connection_id' => $this->conn1->id,
            'customer_id' => $this->customer1->id,
            'meter_reading_id' => $r1->id,
            'invoice_number' => 'INV/TEST/001',
            'invoice_date' => '2026-10-06',
            'due_date' => '2026-10-20',
            'usage_m3' => 10,
            'total_amount' => 25000,
            'balance_due' => 25000,
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        Invoice::create([
            'kpspams_id' => $this->kpspams1->id,
            'billing_period_id' => $this->period1->id,
            'connection_id' => $this->conn1->id,
            'customer_id' => $this->customer1->id,
            'meter_reading_id' => $r2->id,
            'invoice_number' => 'INV/TEST/002',
            'invoice_date' => '2026-10-06',
            'due_date' => '2026-10-20',
            'usage_m3' => 10,
            'total_amount' => 25000,
            'balance_due' => 25000,
        ]);
    }

    /**
     * Test 9: User soft delete dan proteksi hapus akun sendiri / super admin
     */
    public function test_user_soft_delete_and_self_deletion_protection(): void
    {
        $adminRole = Role::create([
            'name' => 'admin_desa',
            'display_name' => 'Admin Desa',
            'scope_level' => 'DESA',
        ]);

        $admin = User::create([
            'name' => 'Admin Desa Test',
            'username' => 'admindesa_test',
            'phone' => '08999999999',
            'password' => 'secret123',
        ]);
        $admin->roles()->attach($adminRole->id);

        $targetUser = User::create([
            'kpspams_id' => $this->kpspams1->id,
            'name' => 'Operator To Delete',
            'username' => 'op_delete',
            'phone' => '08888888888',
            'password' => 'secret123',
        ]);

        $this->actingAs($admin);

        // Hapus akun target
        $response = $this->deleteJson("/api/v1/users/{$targetUser->id}");
        $response->assertStatus(200);

        // Pastikan targetUser ter-soft delete
        $this->assertSoftDeleted('users', ['id' => $targetUser->id]);

        // Percobaan menghapus akun sendiri harus ditolak (400)
        $selfResponse = $this->deleteJson("/api/v1/users/{$admin->id}");
        $selfResponse->assertStatus(400);
    }

    /**
     * Test 10: Registrasi NIK pelanggan mengabaikan record yang telah di-soft delete
     */
    public function test_customer_nik_uniqueness_ignores_soft_deleted_records(): void
    {
        $adminRole = Role::firstOrCreate(['name' => 'admin_desa'], [
            'display_name' => 'Admin Desa',
            'scope_level' => 'DESA',
        ]);

        $admin = User::create([
            'name' => 'Admin Desa NIK Test',
            'username' => 'admin_nik_test',
            'phone' => '08777777777',
            'password' => 'secret123',
        ]);
        $admin->roles()->attach($adminRole->id);

        $this->actingAs($admin);

        // Soft delete customer1
        $this->customer1->delete();
        $this->assertSoftDeleted('customers', ['id' => $this->customer1->id]);

        // Daftarkan pelanggan baru dengan NIK yang sama seperti customer1
        $response = $this->postJson('/api/v1/customers', [
            'customer_type_id' => $this->custType->id,
            'kpspams_id' => $this->kpspams1->id,
            'nik' => $this->customer1->nik,
            'full_name' => 'Pelanggan Pengganti NIK Sama',
            'phone' => '081234567800',
            'identity_address' => 'Dusun Lemo Baru RT 01',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('customers', [
            'full_name' => 'Pelanggan Pengganti NIK Sama',
            'nik' => $this->customer1->nik,
            'deleted_at' => null,
        ]);
    }
}


