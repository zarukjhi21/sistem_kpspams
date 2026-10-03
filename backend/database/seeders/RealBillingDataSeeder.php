<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Connection;
use App\Models\BillingPeriod;
use App\Models\MeterReading;
use App\Models\Invoice;
use App\Services\BillingEngineService;
use App\Services\PaymentProcessingService;
use App\Models\CashAccount;
use App\Models\User;

class RealBillingDataSeeder extends Seeder
{
    public function run(): void
    {
        $billingEngine = app(BillingEngineService::class);
        $paymentService = app(PaymentProcessingService::class);

        $kpspamsList = DB::table('kpspams')->get();

        $months = [
            5 => ['name' => 'Mei 2026', 'code' => '202605', 'status' => 'CLOSED', 'due' => '2026-05-20'],
            6 => ['name' => 'Juni 2026', 'code' => '202606', 'status' => 'CLOSED', 'due' => '2026-06-20'],
            7 => ['name' => 'Juli 2026', 'code' => '202607', 'status' => 'CLOSED', 'due' => '2026-07-20'],
            8 => ['name' => 'Agustus 2026', 'code' => '202608', 'status' => 'CLOSED', 'due' => '2026-08-20'],
            9 => ['name' => 'September 2026', 'code' => '202609', 'status' => 'CLOSED', 'due' => '2026-09-20'],
            10 => ['name' => 'Oktober 2026', 'code' => '202610', 'status' => 'OPEN', 'due' => '2026-10-20'],
        ];

        // 1. Create Billing Periods for each KPSPAMS unit
        $periodMap = []; // [$kpspamsId][$monthNum] => BillingPeriod
        foreach ($kpspamsList as $k) {
            foreach ($months as $mNum => $m) {
                $code = "BP-{$k->code}-{$m['code']}";
                $period = BillingPeriod::firstOrCreate(
                    [
                        'kpspams_id' => $k->id,
                        'period_code' => $code,
                    ],
                    [
                        'name' => "Periode {$m['name']}",
                        'year' => 2026,
                        'month' => $mNum,
                        'reading_start_date' => sprintf('2026-%02d-01', $mNum),
                        'reading_end_date' => sprintf('2026-%02d-05', $mNum),
                        'billing_date' => sprintf('2026-%02d-06', $mNum),
                        'due_date' => $m['due'],
                        'status' => $m['status'],
                    ]
                );
                $periodMap[$k->id][$mNum] = $period;
            }
        }

        // 2. Realistic Consumption Data for Connections (May to October)
        // Connection profiles:
        // - SR-LMB-00001 (Muhammad Yusuf): 12.0, 15.0, 11.5, 13.0, 16.0, 14.5
        // - SR-LMT-00001 (Siti Aminah): 10.0, 12.0, 11.0, 14.0, 13.5, 12.5
        // - SR-SR1-00001 (H. Dahlan Tahir): 18.0, 20.0, 19.5, 22.0, 21.0, 19.0
        // - SR-PKD-00001 (Rustam Effendi): 14.0, 13.5, 15.0, 16.0, 14.0, 15.5
        $connectionProfiles = [
            'SR-LMB-00001' => [12.0, 15.0, 11.5, 13.0, 16.0, 14.5],
        ];

        $connections = Connection::with(['customer', 'meter', 'kpspams'])->get();
        $adminUser = User::where('username', 'admin.desa')->first() ?? User::first();

        foreach ($connections as $conn) {
            $volumes = $connectionProfiles[$conn->connection_no] ?? [10.0, 10.0, 10.0, 10.0, 10.0, 10.0];
            $currentMeterIndex = 100.0; // Initial reading baseline

            $monthIdx = 0;
            foreach ($months as $mNum => $m) {
                $vol = $volumes[$monthIdx] ?? 12.0;
                $prevIndex = $currentMeterIndex;
                $currIndex = $prevIndex + $vol;
                $currentMeterIndex = $currIndex;

                $period = $periodMap[$conn->kpspams_id][$mNum];

                // Create or get Meter Reading
                $reading = MeterReading::firstOrCreate(
                    [
                        'kpspams_id' => $conn->kpspams_id,
                        'billing_period_id' => $period->id,
                        'connection_id' => $conn->id,
                    ],
                    [
                        'meter_id' => $conn->meter_id,
                        'reader_user_id' => $adminUser->id,
                        'reading_date' => sprintf('2026-%02d-03', $mNum),
                        'previous_reading' => $prevIndex,
                        'current_reading' => $currIndex,
                        'usage_m3' => $vol,
                        'meter_photo_path' => 'meter_readings/reading_sample.jpg',
                        'status' => 'VERIFIED',
                        'verified_by' => $adminUser->id,
                        'verified_at' => sprintf('2026-%02d-04 10:00:00', $mNum),
                        'notes' => 'Pencatatan meter rutin lapangan',
                    ]
                );

                // Generate Invoice if not exists
                $existingInv = Invoice::where('billing_period_id', $period->id)
                    ->where('connection_id', $conn->id)
                    ->first();

                if (!$existingInv) {
                    try {
                        $invoice = $billingEngine->generateInvoice($conn, $period, $reading);

                        // If period is May - September, mark as PAID
                        if ($mNum < 10) {
                            $cashAccount = CashAccount::where('kpspams_id', $conn->kpspams_id)->where('is_active', true)->first();
                            if ($cashAccount) {
                                $paymentService->processPayment(
                                    $invoice,
                                    (float)$invoice->total_amount,
                                    $cashAccount->id,
                                    $adminUser->id,
                                    'CASH',
                                    'LUNAS-RUTIN-BULANAN'
                                );
                            }
                        }
                    } catch (\Throwable $e) {
                        echo "Warning for {$conn->connection_no} on month {$mNum}: " . $e->getMessage() . "\n";
                    }
                }

                $monthIdx++;
            }
        }
    }
}
