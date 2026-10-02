<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database in correct dependency order.
     */
    public function run(): void
    {
        $this->call([
            DesaDusunSeeder::class,
            KpspamsSeeder::class,
            RolePermissionSeeder::class,
            UserSeeder::class,
            CustomerTypeTariffSeeder::class,
            BillingPolicyAndOpeningBalanceSeeder::class,
            CustomerConnectionSeeder::class,
        ]);
    }
}
