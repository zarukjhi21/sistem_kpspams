<?php

declare(strict_types=1);

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\MeterAnomalyService;
use App\Models\Connection;

class MeterAnomalyTest extends TestCase
{
    public function test_it_detects_rollback_anomaly_when_current_reading_is_less_than_previous(): void
    {
        $service = new MeterAnomalyService();
        $connection = new Connection();
        $connection->id = 1;

        $previousReading = 150.0;
        $currentReading = 120.0; // Stand mundur

        $result = $service->evaluateReading($connection, $previousReading, $currentReading);

        $this->assertEquals('ANOMALY_ROLLBACK', $result['status']);
        $this->assertEquals(0.00, $result['usage_m3']);
        $this->assertStringContainsString('lebih kecil dari stand sebelumnya', $result['message']);
    }

    public function test_it_verifies_normal_meter_consumption(): void
    {
        $service = new class extends MeterAnomalyService {
            protected function getAveragePastUsage(int $connectionId): float
            {
                return 15.0; // Rata-rata 15 m3
            }
        };

        $connection = new Connection();
        $connection->id = 1;

        $previousReading = 100.0;
        $currentReading = 118.0; // Pemakaian 18 m3 (normal, < 3x rata-rata)

        $result = $service->evaluateReading($connection, $previousReading, $currentReading);

        $this->assertEquals('VERIFIED', $result['status']);
        $this->assertEquals(18.0, $result['usage_m3']);
        $this->assertNull($result['message']);
    }

    public function test_it_flags_warning_spike_when_usage_exceeds_300_percent_of_average(): void
    {
        $service = new class extends MeterAnomalyService {
            protected function getAveragePastUsage(int $connectionId): float
            {
                return 10.0; // Rata-rata 10 m3
            }
        };

        $connection = new Connection();
        $connection->id = 1;

        $previousReading = 100.0;
        $currentReading = 145.0; // Pemakaian 45 m3 (> 30 m3 atau > 300%)

        $result = $service->evaluateReading($connection, $previousReading, $currentReading);

        $this->assertEquals('WARNING_SPIKE', $result['status']);
        $this->assertEquals(45.0, $result['usage_m3']);
        $this->assertStringContainsString('melonjak lebih dari 300%', $result['message']);
    }
}
