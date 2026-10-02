<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\Traits\BelongsToKpspams;

class MeterReading extends Model
{
    use BelongsToKpspams;

    protected $fillable = [
        'kpspams_id',
        'billing_period_id',
        'connection_id',
        'meter_id',
        'reader_user_id',
        'reading_date',
        'previous_reading',
        'current_reading',
        'usage_m3',
        'meter_photo_path',
        'latitude',
        'longitude',
        'status',
        'anomaly_reason',
        'verified_by',
        'verified_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'reading_date' => 'date',
            'previous_reading' => 'float',
            'current_reading' => 'float',
            'usage_m3' => 'float',
            'latitude' => 'float',
            'longitude' => 'float',
            'verified_at' => 'datetime',
        ];
    }

    public function billingPeriod(): BelongsTo
    {
        return $this->belongsTo(BillingPeriod::class);
    }

    public function connection(): BelongsTo
    {
        return $this->belongsTo(Connection::class);
    }

    public function meter(): BelongsTo
    {
        return $this->belongsTo(Meter::class);
    }

    public function reader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reader_user_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }
}
