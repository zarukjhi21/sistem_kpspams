<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Traits\BelongsToKpspams;

class BillingPeriod extends Model
{
    use BelongsToKpspams;

    protected $fillable = [
        'kpspams_id',
        'period_code',
        'name',
        'year',
        'month',
        'reading_start_date',
        'reading_end_date',
        'billing_date',
        'due_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'month' => 'integer',
            'reading_start_date' => 'date',
            'reading_end_date' => 'date',
            'billing_date' => 'date',
            'due_date' => 'date',
        ];
    }

    public function meterReadings(): HasMany
    {
        return $this->hasMany(MeterReading::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
