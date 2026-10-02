<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Kpspams;
use App\Models\Desa;
use App\Models\Customer;
use App\Models\CustomerType;
use App\Models\Connection;
use App\Models\BillingPeriod;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ApiSecurityAuditTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $user;
    protected Kpspams $kpspams;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'super_admin', 'display_name' => 'Super Admin', 'scope_level' => 'GLOBAL']);
        Role::create(['name' => 'admin_kpspams', 'display_name' => 'Admin KPSPAMS', 'scope_level' => 'KPSPAMS']);
        Role::create(['name' => 'pelanggan', 'display_name' => 'Pelanggan', 'scope_level' => 'OWN_CUSTOMER']);

        $desa = Desa::create([
            'code' => '7604012001',
            'name' => 'Kuajang',
            'subdistrict' => 'Binuang',
            'district' => 'Polewali Mandar',
            'province' => 'Sulawesi Barat',
        ]);

        $this->kpspams = Kpspams::create([
            'desa_id' => $desa->id,
            'code' => 'KP-LMB',
            'name' => 'KPSPAMS Lemo Baru',
        ]);

        $this->admin = User::create([
            'kpspams_id' => $this->kpspams->id,
            'name' => 'Admin Test',
            'username' => 'admin_test',
            'phone' => '0811111111',
            'password' => 'secret123',
        ]);
        $this->admin->roles()->attach(Role::where('name', 'admin_kpspams')->first()->id);

        \Illuminate\Support\Facades\Cache::flush();
    }

    /**
     * Test 1: Security Headers & X-Powered-By Removal
     */
    public function test_security_headers_are_present_and_x_powered_by_is_removed(): void
    {
        $response = $this->getJson('/api/v1/health');
        $response->assertStatus(200);

        // Pastikan header keamanan ada
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('X-XSS-Protection', '1; mode=block');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // Pastikan X-Powered-By TIDAK bocor
        $this->assertFalse($response->headers->has('X-Powered-By'), 'X-Powered-By tidak boleh dibocorkan ke client.');
    }

    /**
     * Test 2: Login Endpoint Rate Limiting (Throttle 10 per minute)
     */
    public function test_login_rate_limiting_enforced(): void
    {
        // Lakukan 10 percobaan login gagal
        for ($i = 0; $i < 10; $i++) {
            $res = $this->postJson('/api/v1/auth/login', [
                'username' => 'admin_test',
                'password' => 'wrong_password',
            ]);
            $this->assertEquals(401, $res->status());
        }

        // Percobaan ke-11 harus diblokir oleh rate limiter (429 Too Many Requests)
        $rateLimited = $this->postJson('/api/v1/auth/login', [
            'username' => 'admin_test',
            'password' => 'wrong_password',
        ]);
        $this->assertEquals(429, $rateLimited->status(), 'Endpoint login harus dibatasi dengan rate limiting (429).');
    }

    /**
     * Test 3: File Upload Validation Rejects SVG and Malicious File Types (Stored XSS Defense)
     */
    public function test_file_upload_svg_and_malicious_mimes_are_rejected(): void
    {
        Storage::fake('public');
        $this->actingAs($this->admin);

        // 1. Coba upload file SVG (berbahaya untuk XSS) ke photo pengaduan
        $svgFile = UploadedFile::fake()->create('exploit.svg', 100, 'image/svg+xml');

        $custType = CustomerType::create(['code' => 'R1', 'name' => 'Rumah Tangga']);
        $cust = Customer::create([
            'kpspams_id' => $this->kpspams->id,
            'customer_type_id' => $custType->id,
            'code' => 'CUST-001',
            'nik' => '7604010101900001',
            'full_name' => 'Warga Test',
            'phone' => '081234567890',
            'identity_address' => 'Jl. Test',
        ]);

        $response = $this->postJson('/api/v1/complaints', [
            'customer_id' => $cust->id,
            'category' => 'PIPA_BOCOR',
            'description' => 'Pipa depan rumah pecah dan bocor deras',
            'photo' => $svgFile,
        ]);

        // Upload SVG harus ditolak dengan validasi 422
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['photo']);

        // 2. Coba upload file EXE
        $exeFile = UploadedFile::fake()->create('malware.exe', 500, 'application/x-msdownload');
        $responseExe = $this->postJson('/api/v1/complaints', [
            'customer_id' => $cust->id,
            'category' => 'PIPA_BOCOR',
            'description' => 'Pipa depan rumah pecah dan bocor deras',
            'photo' => $exeFile,
        ]);
        $responseExe->assertStatus(422);
        $responseExe->assertJsonValidationErrors(['photo']);
    }

    /**
     * Test 4: Pagination per_page parameter is capped at 100 (DoS Defense)
     */
    public function test_pagination_per_page_is_capped_at_100_to_prevent_dos(): void
    {
        $this->actingAs($this->admin);

        // Minta per_page = 999999
        $response = $this->getJson('/api/v1/customers?per_page=999999');
        $response->assertStatus(200);

        // Pastikan per_page dibatasi maksimal 100
        $data = $response->json();
        $this->assertLessThanOrEqual(100, $data['meta']['per_page'] ?? 100);
    }

    /**
     * Test 5: Method Not Allowed returns standardized JSON (405)
     */
    public function test_method_not_allowed_returns_clean_json(): void
    {
        // Rute /health hanya mendukung GET, panggil dengan POST
        $response = $this->postJson('/api/v1/health');
        $response->assertStatus(405);
        $this->assertEquals('error', $response->json('status'));
        $this->assertEquals('METHOD_NOT_ALLOWED', $response->json('error_code'));
    }

    /**
     * Test 6: Not Found returns standardized JSON (404)
     */
    public function test_not_found_returns_clean_json(): void
    {
        $response = $this->getJson('/api/v1/non-existent-endpoint-xyz');
        $response->assertStatus(404);
        $this->assertEquals('error', $response->json('status'));
        $this->assertEquals('RESOURCE_NOT_FOUND', $response->json('error_code'));
    }

    /**
     * Test 7: Sensitive Data Masking - Password & Hashes Never Exposed
     */
    public function test_auth_me_and_login_do_not_leak_password_or_password_hash(): void
    {
        // 1. Response Login
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'username' => 'admin_test',
            'password' => 'secret123',
        ]);
        $loginRes->assertStatus(200);
        $loginJson = json_encode($loginRes->json());
        $this->assertStringNotContainsString('password_hash', $loginJson);
        $this->assertStringNotContainsString('secret123', $loginJson);
        $this->assertArrayNotHasKey('password', $loginRes->json('data.user'));

        // 2. Response /auth/me
        $token = $loginRes->json('data.access_token');
        $meRes = $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/v1/auth/me');
        $meRes->assertStatus(200);
        $meJson = json_encode($meRes->json());
        $this->assertStringNotContainsString('password', $meJson);
    }
}
