<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Connection;
use App\Models\MeterReading;

class MeterAnomalyService
{
    /**
     * Evaluasi anomali pembacaan meter air.
     *
     * @return array{status: string, usage_m3: float, message: ?string}
     */
    public function evaluateReading(Connection $connection, float $previousReading, float $currentReading): array
    {
        // 1. Kondisi Rollback (Stand Mundur)
        if ($currentReading < $previousReading) {
            return [
                'status' => 'ANOMALY_ROLLBACK',
                'usage_m3' => 0.00,
                'message' => "Stand akhir ({$currentReading}) lebih kecil dari stand sebelumnya ({$previousReading}). Kemungkinan penggantian meter atau salah catat angka.",
            ];
        }

        $usage = $currentReading - $previousReading;

        // 2. Evaluasi Lonjakan Ekstrem (Spike Detection)
        $avgPastUsage = $this->getAveragePastUsage($connection->id);
        if ($avgPastUsage > 0 && $usage > (3.0 * $avgPastUsage)) {
            return [
                'status' => 'WARNING_SPIKE',
                'usage_m3' => $usage,
                'message' => "Pemakaian bulan ini ({$usage} m³) melonjak lebih dari 300% dibanding rata-rata 3 bulan terakhir ({$avgPastUsage} m³). Perlu verifikasi potensi kebocoran.",
            ];
        }

        return [
            'status' => 'VERIFIED',
            'usage_m3' => $usage,
            'message' => null,
        ];
    }

    protected function getAveragePastUsage(int $connectionId): float
    {
        $avg = MeterReading::where('connection_id', $connectionId)
            ->whereIn('status', ['VERIFIED', 'INVOICED'])
            ->latest('reading_date')
            ->take(3)
            ->avg('usage_m3');

        return $avg ? (float) $avg : 0.00;
    }
}
