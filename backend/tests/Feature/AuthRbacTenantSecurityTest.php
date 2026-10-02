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
use App\Models\Asset;
use App\Models\FinancialTransaction;
use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

class AuthRbacTenantSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected Desa $desa;
    protected Kpspams $kpspamsLemoBaru;
    protected Kpspams $kpspamsLemoTua;
    protected Kpspams $kpspamsSarampu1;
    protected Dusun $dusunLemoBaru;
    protected Dusun $dusunLemoTua;
    protected Dusun $dusunSarampu1;
    protected Dusun $dusunPakkandoang;

    protected User $adminLemoBaru;
    protected User $adminLemoTua;
    protected User $bendaharaLemoBaru;
    protected User $petugasLemoBaru;
    protected User $pelangganLemoBaru1;
    protected User $pelangganLemoBaru2;

    protected Customer $customerLemoBaru1;
    protected Customer $customerLemoBaru2;
    protected Customer $customerLemoTua;
    protected Invoice $invoiceLemoBaru1;
    protected Invoice $invoiceLemoTua;
    protected Payment $paymentLemoTua;
    protected Asset $assetLemoTua;
    protected FinancialTransaction $trxLemoTua;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Roles
        $roles = [
            'super_admin' => 'GLOBAL',
            'admin_desa' => 'DESA',
            'pemerintah_desa' => 'DESA',
            'ketua_kpspams' => 'KPSPAMS',
            'admin_kpspams' => 'KPSPAMS',
            'bendahara_kpspams' => 'KPSPAMS',
            'petugas_lapangan' => 'KPSPAMS',
            'pelanggan' => 'OWN_CUSTOMER',
        ];

        foreach ($roles as $rName => $scope) {
            Role::create([
                'name' => $rName,
                'display_name' => ucwords(str_replace('_', ' ', $rName)),
                'scope_level' => $scope,
            ]);
        }

        // 2. Desa & Dusun
        $this->desa = Desa::create([
            'code' => '7604012001',
            'name' => 'Kuajang',
            'subdistrict' => 'Binuang',
            'district' => 'Polewali Mandar',
            'province' => 'Sulawesi Barat',
        ]);

        $this->dusunLemoBaru = Dusun::create(['desa_id' => $this->desa->id, 'code' => 'DS-LMB', 'name' => 'Lemo Baru']);
        $this->dusunLemoTua = Dusun::create(['desa_id' => $this->desa->id, 'code' => 'DS-LMT', 'name' => 'Lemo Tua']);
        $this->dusunSarampu1 = Dusun::create(['desa_id' => $this->desa->id, 'code' => 'DS-SR1', 'name' => 'Sarampu 1']);
        $this->dusunPakkandoang = Dusun::create(['desa_id' => $this->desa->id, 'code' => 'DS-PKD', 'name' => 'Pakkandoang']);

        // 3. KPSPAMS
        $this->kpspamsLemoBaru = Kpspams::create(['desa_id' => $this->desa->id, 'code' => 'KP-LMB', 'name' => 'KPSPAMS Lemo Baru']);
        $this->kpspamsLemoTua = Kpspams::create(['desa_id' => $this->desa->id, 'code' => 'KP-LMT', 'name' => 'KPSPAMS Lemo Tua']);
        $this->kpspamsSarampu1 = Kpspams::create(['desa_id' => $this->desa->id, 'code' => 'KP-SR1', 'name' => 'KPSPAMS Sarampu 1']);

        // 4. Mapping Wilayah (kpspams_dusun)
        DB::table('kpspams_dusun')->insert([
            ['kpspams_id' => $this->kpspamsLemoBaru->id, 'dusun_id' => $this->dusunLemoBaru->id, 'is_primary' => true, 'created_at' => now()],
            ['kpspams_id' => $this->kpspamsLemoTua->id, 'dusun_id' => $this->dusunLemoTua->id, 'is_primary' => true, 'created_at' => now()],
            ['kpspams_id' => $this->kpspamsSarampu1->id, 'dusun_id' => $this->dusunSarampu1->id, 'is_primary' => true, 'created_at' => now()],
            ['kpspams_id' => $this->kpspamsSarampu1->id, 'dusun_id' => $this->dusunPakkandoang->id, 'is_primary' => false, 'created_at' => now()],
        ]);

        $custType = CustomerType::create(['code' => 'R1', 'name' => 'Rumah Tangga']);

        // 5. Customers
        $this->customerLemoBaru1 = Customer::create([
            'kpspams_id' => $this->kpspamsLemoBaru->id,
            'customer_type_id' => $custType->id,
            'code' => 'CUST-LMB-01',
            'nik' => '7604010101900001',
            'full_name' => 'Warga Lemo Baru 1',
            'phone' => '081234567801',
            'identity_address' => 'Lemo Baru RT 01',
        ]);

        $this->customerLemoBaru2 = Customer::create([
            'kpspams_id' => $this->kpspamsLemoBaru->id,
            'customer_type_id' => $custType->id,
            'code' => 'CUST-LMB-02',
            'nik' => '7604010101900002',
            'full_name' => 'Warga Lemo Baru 2',
            'phone' => '081234567802',
            'identity_address' => 'Lemo Baru RT 02',
        ]);

        $this->customerLemoTua = Customer::create([
            'kpspams_id' => $this->kpspamsLemoTua->id,
            'customer_type_id' => $custType->id,
            'code' => 'CUST-LMT-01',
            'nik' => '7604010101900099',
            'full_name' => 'Warga Lemo Tua 1',
            'phone' => '081234567899',
            'identity_address' => 'Lemo Tua RT 01',
        ]);

        // 6. Users
        $this->adminLemoBaru = User::create([
            'kpspams_id' => $this->kpspamsLemoBaru->id,
            'name' => 'Admin Lemo Baru',
            'username' => 'admin_lmb',
            'phone' => '0811111111',
            'password' => 'secret123',
        ]);
        $this->adminLemoBaru->roles()->attach(Role::where('name', 'admin_kpspams')->first()->id);

        $this->adminLemoTua = User::create([
            'kpspams_id' => $this->kpspamsLemoTua->id,
            'name' => 'Admin Lemo Tua',
            'username' => 'admin_lmt',
            'phone' => '0822222222',
            'password' => 'secret123',
        ]);
        $this->adminLemoTua->roles()->attach(Role::where('name', 'admin_kpspams')->first()->id);

        $this->bendaharaLemoBaru = User::create([
            'kpspams_id' => $this->kpspamsLemoBaru->id,
            'name' => 'Bendahara Lemo Baru',
            'username' => 'kasir_lmb',
            'phone' => '0833333333',
            'password' => 'secret123',
        ]);
        $this->bendaharaLemoBaru->roles()->attach(Role::where('name', 'bendahara_kpspams')->first()->id);

        $this->petugasLemoBaru = User::create([
            'kpspams_id' => $this->kpspamsLemoBaru->id,
            'name' => 'Petugas Lemo Baru',
            'username' => 'petugas_lmb',
            'phone' => '0844444444',
            'password' => 'secret123',
        ]);
        $this->petugasLemoBaru->roles()->attach(Role::where('name', 'petugas_lapangan')->first()->id);

        $this->pelangganLemoBaru1 = User::create([
            'kpspams_id' => $this->kpspamsLemoBaru->id,
            'customer_id' => $this->customerLemoBaru1->id,
            'name' => 'Akun Warga 1',
            'username' => 'warga_lmb1',
            'phone' => '0855555555',
            'password' => 'secret123',
        ]);
        $this->pelangganLemoBaru1->roles()->attach(Role::where('name', 'pelanggan')->first()->id);

        $this->pelangganLemoBaru2 = User::create([
            'kpspams_id' => $this->kpspamsLemoBaru->id,
            'customer_id' => $this->customerLemoBaru2->id,
            'name' => 'Akun Warga 2',
            'username' => 'warga_lmb2',
            'phone' => '0866666666',
            'password' => 'secret123',
        ]);
        $this->pelangganLemoBaru2->roles()->attach(Role::where('name', 'pelanggan')->first()->id);

        // 7. Data Transaksional Lemo Tua
        $periodLMT = BillingPeriod::create([
            'kpspams_id' => $this->kpspamsLemoTua->id,
            'period_code' => '202610',
            'name' => 'Oktober 2026 LMT',
            'year' => 2026,
            'month' => 10,
            'reading_start_date' => '2026-10-01',
            'reading_end_date' => '2026-10-05',
            'billing_date' => '2026-10-06',
            'due_date' => '2026-10-20',
        ]);

        $meterLMT = Meter::create([
            'kpspams_id' => $this->kpspamsLemoTua->id,
            'serial_number' => 'MTR-LMT-01',
            'brand' => 'Onda',
            'initial_reading' => 0.00,
        ]);

        $connLMT = Connection::create([
            'kpspams_id' => $this->kpspamsLemoTua->id,
            'customer_id' => $this->customerLemoTua->id,
            'dusun_id' => $this->dusunLemoTua->id,
            'meter_id' => $meterLMT->id,
            'connection_no' => 'SR-KP02-00001',
            'address_detail' => 'Lemo Tua RT 01',
        ]);

        $readingLMT = MeterReading::create([
            'kpspams_id' => $this->kpspamsLemoTua->id,
            'billing_period_id' => $periodLMT->id,
            'connection_id' => $connLMT->id,
            'meter_id' => $meterLMT->id,
            'previous_reading' => 0.00,
            'current_reading' => 12.00,
            'usage_m3' => 12.00,
            'meter_photo_path' => 'meter_photos/lmt.jpg',
            'status' => 'VERIFIED',
        ]);

        $this->invoiceLemoTua = Invoice::create([
            'kpspams_id' => $this->kpspamsLemoTua->id,
            'billing_period_id' => $periodLMT->id,
            'connection_id' => $connLMT->id,
            'customer_id' => $this->customerLemoTua->id,
            'meter_reading_id' => $readingLMT->id,
            'invoice_number' => 'INV/202610/KP02/AAAA',
            'invoice_date' => '2026-10-06',
            'due_date' => '2026-10-20',
            'usage_m3' => 12.00,
            'water_amount' => 24000.00,
            'admin_fee' => 5000.00,
            'total_amount' => 29000.00,
            'paid_amount' => 0.00,
            'balance_due' => 29000.00,
            'status' => 'UNPAID',
        ]);

        $cashAccLMT = CashAccount::create([
            'kpspams_id' => $this->kpspamsLemoTua->id,
            'account_code' => 'KAS-LMT',
            'account_name' => 'Kas Lemo Tua',
            'opening_balance' => 0.00,
            'current_balance' => 29000.00,
        ]);

        $this->paymentLemoTua = Payment::create([
            'kpspams_id' => $this->kpspamsLemoTua->id,
            'invoice_id' => $this->invoiceLemoTua->id,
            'customer_id' => $this->customerLemoTua->id,
            'cash_account_id' => $cashAccLMT->id,
            'received_by_user_id' => $this->adminLemoTua->id,
            'receipt_number' => 'KW/20261006/KP02/9999',
            'payment_date' => now(),
            'amount_paid' => 29000.00,
            'payment_method' => 'CASH',
            'status' => 'SUCCESS',
        ]);

        $assetCat = \App\Models\AssetCategory::create([
            'code' => 'POMPA',
            'name' => 'Pompa & Mesin',
        ]);

        $this->assetLemoTua = Asset::create([
            'kpspams_id' => $this->kpspamsLemoTua->id,
            'category_id' => $assetCat->id,
            'asset_code' => 'AST-LMT-01',
            'name' => 'Pompa Submersible Lemo Tua',
            'location_description' => 'Sumur Bor RT 01',
            'acquisition_year' => 2020,
            'purchase_value' => 15000000.00,
            'condition' => 'GOOD',
            'status' => 'OPERATIONAL',
        ]);

        $this->trxLemoTua = FinancialTransaction::create([
            'kpspams_id' => $this->kpspamsLemoTua->id,
            'cash_account_id' => $cashAccLMT->id,
            'transaction_number' => 'TX-LMT-001',
            'transaction_date' => now()->toDateString(),
            'transaction_type' => 'EXPENSE',
            'category' => 'OPERASIONAL_PLN',
            'amount' => 500000.00,
            'description' => 'Bayar Listrik PLN Pompa LMT',
            'created_by' => $this->adminLemoTua->id,
        ]);
    }

    /**
     * Test 1: User Lemo Baru TIDAK BISA melihat detail customer Lemo Tua (BOLA / IDOR Defense)
     */
    public function test_user_lemo_baru_cannot_view_customer_lemo_tua(): void
    {
        $this->actingAs($this->adminLemoBaru);
        $response = $this->getJson("/api/v1/customers/{$this->customerLemoTua->id}");
        $this->assertContains($response->status(), [403, 404]);
    }

    /**
     * Test 2: User Lemo Baru TIDAK BISA melihat invoice Lemo Tua
     */
    public function test_user_lemo_baru_cannot_view_invoice_lemo_tua(): void
    {
        $this->actingAs($this->adminLemoBaru);
        $response = $this->getJson("/api/v1/invoices/{$this->invoiceLemoTua->id}");
        $this->assertContains($response->status(), [403, 404]);
    }

    /**
     * Test 3: User Lemo Baru TIDAK BISA melihat payment Lemo Tua
     */
    public function test_user_lemo_baru_cannot_view_payment_lemo_tua(): void
    {
        $this->actingAs($this->adminLemoBaru);
        $response = $this->getJson("/api/v1/payments/{$this->paymentLemoTua->id}");
        $this->assertContains($response->status(), [403, 404]);
    }

    /**
     * Test 4: User Lemo Baru TIDAK BISA mengubah data customer Lemo Tua
     */
    public function test_user_lemo_baru_cannot_update_customer_lemo_tua(): void
    {
        $this->actingAs($this->adminLemoBaru);
        $response = $this->putJson("/api/v1/customers/{$this->customerLemoTua->id}", [
            'full_name' => 'Hacked by Lemo Baru',
        ]);
        $this->assertContains($response->status(), [403, 404]);
        $this->assertDatabaseMissing('customers', ['full_name' => 'Hacked by Lemo Baru']);
    }

    /**
     * Test 5: User Lemo Baru TIDAK BISA membuat payment untuk invoice Lemo Tua
     */
    public function test_user_lemo_baru_cannot_create_payment_for_invoice_lemo_tua(): void
    {
        $cashAccLMB = CashAccount::create([
            'kpspams_id' => $this->kpspamsLemoBaru->id,
            'account_code' => 'KAS-LMB',
            'account_name' => 'Kas Lemo Baru',
            'current_balance' => 50000.00,
        ]);

        $this->actingAs($this->bendaharaLemoBaru);
        $response = $this->postJson('/api/v1/payments', [
            'invoice_id' => $this->invoiceLemoTua->id,
            'cash_account_id' => $cashAccLMB->id,
            'amount_paid' => 29000.00,
            'payment_method' => 'CASH',
        ]);

        $this->assertContains($response->status(), [400, 403, 404, 422]);
    }

    /**
     * Test 6: User Lemo Baru TIDAK BISA melihat aset Lemo Tua
     */
    public function test_user_lemo_baru_cannot_view_assets_of_lemo_tua(): void
    {
        $this->actingAs($this->adminLemoBaru);
        $response = $this->getJson("/api/v1/assets/{$this->assetLemoTua->id}");
        $this->assertContains($response->status(), [403, 404]);
    }

    /**
     * Test 7: User Lemo Baru TIDAK BISA melihat transaksi keuangan Lemo Tua
     */
    public function test_user_lemo_baru_cannot_view_financial_transactions_of_lemo_tua(): void
    {
        $this->actingAs($this->bendaharaLemoBaru);
        $response = $this->getJson('/api/v1/finance/transactions');
        $response->assertStatus(200);

        // Tidak boleh ada transaksi milik Lemo Tua di respons
        $items = $response->json('data');
        foreach ($items as $item) {
            $this->assertNotEquals($this->kpspamsLemoTua->id, $item['kpspams_id'] ?? null);
            $this->assertNotEquals('TX-LMT-001', $item['transaction_number']);
        }
    }

    /**
     * Test 8: User KPSPAMS TIDAK BISA memanipulasi scope tenant via query/body kpspams_id
     */
    public function test_user_cannot_override_tenant_scope_via_query_or_body_parameter(): void
    {
        $this->actingAs($this->adminLemoBaru);

        // Percobaan mengambil daftar pelanggan Lemo Tua via query kpspams_id
        $response = $this->getJson("/api/v1/customers?kpspams_id={$this->kpspamsLemoTua->id}");
        $response->assertStatus(200);

        // Respons HARUS tetap hanya memuat pelanggan Lemo Baru, bukan Lemo Tua
        $customers = $response->json('data');
        foreach ($customers as $c) {
            $this->assertEquals($this->kpspamsLemoBaru->id, $c['kpspams_id']);
            $this->assertNotEquals($this->customerLemoTua->id, $c['id']);
        }
    }

    /**
     * Test 9: Customer IDOR - Pelanggan TIDAK BISA melihat data pelanggan lain
     */
    public function test_pelanggan_cannot_view_other_customers_data_idor(): void
    {
        // Login sebagai Warga 1
        $this->actingAs($this->pelangganLemoBaru1);

        // Percobaan melihat profil Warga 2 (meski sama-sama di Lemo Baru)
        $response = $this->getJson("/api/v1/customers/{$this->customerLemoBaru2->id}");
        $this->assertContains($response->status(), [403, 404]);

        // Namun harus bisa melihat profil miliknya sendiri
        $ownResponse = $this->getJson("/api/v1/customers/{$this->customerLemoBaru1->id}");
        $ownResponse->assertStatus(200);
        $this->assertEquals($this->customerLemoBaru1->id, $ownResponse->json('data.id'));
    }

    /**
     * Test 10: Vertical Privilege Escalation - Pelanggan TIDAK BISA membuat tarif
     */
    public function test_vertical_privilege_escalation_pelanggan_cannot_create_tariff(): void
    {
        $this->actingAs($this->pelangganLemoBaru1);

        $response = $this->postJson('/api/v1/tariffs', [
            'customer_type_id' => 1,
            'name' => 'Tarif Palsu Hacker',
            'effective_from' => '2026-10-01',
            'fixed_admin_fee' => 0,
            'maintenance_fee' => 0,
            'components' => [
                ['tier_order' => 1, 'tier_min_m3' => 0, 'tier_max_m3' => 10, 'rate_per_m3' => 100],
            ],
        ]);

        $this->assertEquals(403, $response->status(), 'Pelanggan tidak boleh diizinkan membuat skema tarif.');
    }

    /**
     * Test 11: Sarampu 1 Service Area - Mengizinkan Sarampu 1 & Pakkandoang, Menolak Lemo Baru & Lemo Tua
     */
    public function test_sarampu_1_service_area_allows_sarampu_1_and_pakkandoang_but_rejects_lemo(): void
    {
        $custType = CustomerType::first();

        $custSarampu = Customer::create([
            'kpspams_id' => $this->kpspamsSarampu1->id,
            'customer_type_id' => $custType->id,
            'code' => 'CUST-SR1-01',
            'nik' => '7604010101900555',
            'full_name' => 'Warga Sarampu',
            'phone' => '087711223344',
            'identity_address' => 'Dusun Sarampu 1',
        ]);

        $adminSarampu = User::create([
            'kpspams_id' => $this->kpspamsSarampu1->id,
            'name' => 'Admin Sarampu 1',
            'username' => 'admin_sr1',
            'phone' => '087788990011',
            'password' => 'secret123',
        ]);
        $adminSarampu->roles()->attach(Role::where('name', 'admin_kpspams')->first()->id);

        $this->actingAs($adminSarampu);

        // 1. Sambungan di Dusun Sarampu 1 -> HARUS DIIZINKAN (201)
        $resSarampu = $this->postJson('/api/v1/connections', [
            'customer_id' => $custSarampu->id,
            'dusun_id' => $this->dusunSarampu1->id,
            'meter_serial' => 'MTR-SR-01',
            'meter_brand' => 'Onda',
            'initial_reading' => 0,
            'address_detail' => 'Dusun Sarampu RT 01',
        ]);
        $resSarampu->assertStatus(201);

        // 2. Sambungan di Dusun Pakkandoang -> HARUS DIIZINKAN (201)
        $resPakkandoang = $this->postJson('/api/v1/connections', [
            'customer_id' => $custSarampu->id,
            'dusun_id' => $this->dusunPakkandoang->id,
            'meter_serial' => 'MTR-PKD-01',
            'meter_brand' => 'Onda',
            'initial_reading' => 0,
            'address_detail' => 'Dusun Pakkandoang RT 02',
        ]);
        $resPakkandoang->assertStatus(201);

        // 3. Sambungan di Dusun Lemo Baru -> HARUS DITOLAK (422 / 403)
        $resLemoBaru = $this->postJson('/api/v1/connections', [
            'customer_id' => $custSarampu->id,
            'dusun_id' => $this->dusunLemoBaru->id,
            'meter_serial' => 'MTR-ILLEGAL-01',
            'meter_brand' => 'Onda',
            'initial_reading' => 0,
            'address_detail' => 'Dusun Lemo Baru',
        ]);
        $this->assertContains($resLemoBaru->status(), [403, 422], 'KPSPAMS Sarampu 1 tidak boleh melayani Dusun Lemo Baru.');
    }

    /**
     * Test 12: Unauthenticated endpoints must return 401 Unauthorized
     */
    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/v1/customers')->assertStatus(401);
        $this->postJson('/api/v1/payments', [])->assertStatus(401);
        $this->getJson('/api/v1/dashboard/overview')->assertStatus(401);
        $this->getJson('/api/v1/reports/water-consumption')->assertStatus(401);
    }

    /**
     * Test 13: Customer IDOR on Invoices
     */
    public function test_pelanggan_cannot_view_other_customers_invoice_idor(): void
    {
        $this->actingAs($this->pelangganLemoBaru1);

        // Mencoba melihat invoice Lemo Tua
        $response = $this->getJson("/api/v1/invoices/{$this->invoiceLemoTua->id}");
        $this->assertContains($response->status(), [403, 404]);

        // Mencoba mengunduh PDF invoice Lemo Tua
        $pdfResponse = $this->getJson("/api/v1/invoices/{$this->invoiceLemoTua->id}/pdf");
        $this->assertContains($pdfResponse->status(), [403, 404]);
    }

    /**
     * Test 14: Customer IDOR on Payments
     */
    public function test_pelanggan_cannot_view_other_customers_payment_idor(): void
    {
        $this->actingAs($this->pelangganLemoBaru1);

        // Mencoba melihat kwitansi payment Lemo Tua
        $response = $this->getJson("/api/v1/payments/{$this->paymentLemoTua->id}");
        $this->assertContains($response->status(), [403, 404]);
    }

    /**
     * Test 15: Pelanggan cannot access staff/management endpoints
     */
    public function test_pelanggan_cannot_access_staff_endpoints(): void
    {
        $this->actingAs($this->pelangganLemoBaru1);

        $this->getJson('/api/v1/arrears')->assertStatus(403);
        $this->getJson('/api/v1/dashboard/overview')->assertStatus(403);
        $this->getJson('/api/v1/reports/water-consumption')->assertStatus(403);
        $this->getJson('/api/v1/reports/billing-collection')->assertStatus(403);
        $this->getJson('/api/v1/finance/cash-accounts')->assertStatus(403);
        $this->getJson('/api/v1/finance/transactions')->assertStatus(403);
        $this->getJson('/api/v1/audit-logs')->assertStatus(403);
    }

    /**
     * Test 16: Petugas Lapangan cannot perform financial or admin actions
     */
    public function test_petugas_lapangan_cannot_perform_financial_or_admin_actions(): void
    {
        $this->actingAs($this->petugasLemoBaru);

        // Tidak boleh membuat kasir payment
        $this->postJson('/api/v1/payments', [])->assertStatus(403);

        // Tidak boleh membuat tarif
        $this->postJson('/api/v1/tariffs', [])->assertStatus(403);

        // Tidak boleh membuat rekening kas
        $this->postJson('/api/v1/finance/cash-accounts', [])->assertStatus(403);

        // Tidak boleh membuka/menutup periode tagihan
        $this->postJson('/api/v1/billing-periods', [])->assertStatus(403);

        // Tidak boleh melihat laporan keuangan
        $this->getJson('/api/v1/reports/cash-flow')->assertStatus(403);
    }

    /**
     * Test 17: Ketua KPSPAMS cannot escalate privilege or manage users of another KPSPAMS
     */
    public function test_ketua_kpspams_cannot_escalate_or_manage_users_of_another_kpspams(): void
    {
        $ketuaLMB = User::create([
            'kpspams_id' => $this->kpspamsLemoBaru->id,
            'name' => 'Ketua Lemo Baru',
            'username' => 'ketua_lmb',
            'phone' => '0899999991',
            'password' => 'secret123',
        ]);
        $ketuaLMB->roles()->attach(Role::where('name', 'ketua_kpspams')->first()->id);

        $this->actingAs($ketuaLMB);

        // 1. Mencoba membuat akun Super Admin -> HARUS DITOLAK (403)
        $resSuper = $this->postJson('/api/v1/users', [
            'name' => 'Hacker Super Admin',
            'username' => 'hacker_super',
            'phone' => '0899999992',
            'password' => 'secret123',
            'role' => 'super_admin',
        ]);
        $resSuper->assertStatus(403);

        // 2. Mencoba melihat detail user Admin Lemo Tua -> HARUS DITOLAK (403)
        $resViewLMT = $this->getJson("/api/v1/users/{$this->adminLemoTua->id}");
        $resViewLMT->assertStatus(403);

        // 3. Membuat user petugas lapangan -> kpspams_id HARUS terkunci ke Lemo Baru
        $resCreatePetugas = $this->postJson('/api/v1/users', [
            'name' => 'Petugas Baru LMB',
            'username' => 'petugas_baru_lmb',
            'phone' => '0899999993',
            'password' => 'secret123',
            'role' => 'petugas_lapangan',
            'kpspams_id' => $this->kpspamsLemoTua->id, // Manipulasi kpspams_id ke Lemo Tua
        ]);
        $resCreatePetugas->assertStatus(201);
        // Pastikan kpspams_id yang tersimpan TETAP milik Lemo Baru pembuat
        $this->assertEquals($this->kpspamsLemoBaru->id, $resCreatePetugas->json('data.kpspams_id'));
    }

    /**
     * Test 18: Pelanggan cannot create or update complaints for other customers
     */
    public function test_pelanggan_cannot_create_or_update_complaints_for_others(): void
    {
        $this->actingAs($this->pelangganLemoBaru1);

        // 1. Warga 1 mencoba membuat pengaduan atas nama Warga 2
        $resCreate = $this->postJson('/api/v1/complaints', [
            'customer_id' => $this->customerLemoBaru2->id,
            'category' => 'PIPA_BOCOR',
            'description' => 'Pipa bocor di depan rumah warga 2',
        ]);
        $resCreate->assertStatus(201);
        // ID customer HARUS otomatis dipaksa menjadi Warga 1
        $this->assertEquals($this->customerLemoBaru1->id, $resCreate->json('data.customer_id'));

        $complaintId = $resCreate->json('data.id');

        // 2. Warga 2 login dan mencoba mengubah pengaduan milik Warga 1
        $this->actingAs($this->pelangganLemoBaru2);
        $resUpdate = $this->putJson("/api/v1/complaints/{$complaintId}", [
            'description' => 'Deskripsi dirusak oleh Warga 2',
        ]);
        $this->assertContains($resUpdate->status(), [403, 404]);
    }
}
