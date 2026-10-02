<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Customer;
use App\Models\Scopes\KpspamsScope;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MultiTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_kpspams_scope_injects_correct_tenant_id_for_regular_kpspams_user(): void
    {
        $user = new User();
        $user->id = 10;
        $user->kpspams_id = 1; // Operator KPSPAMS Lemo Baru

        // Mock acting user
        $this->actingAs($user);

        $query = Customer::query();
        $scope = new KpspamsScope();
        $scope->apply($query, new Customer());

        $sql = $query->toSql();
        $bindings = $query->getBindings();

        // Query harus mengandung filter kpspams_id
        $this->assertStringContainsString('kpspams_id', $sql);
        $this->assertContains(1, $bindings);
    }
}
