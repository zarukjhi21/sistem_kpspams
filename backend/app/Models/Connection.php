<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Traits\BelongsToKpspams;

class Connection extends Model
{
    use SoftDeletes, BelongsToKpspams;

    protected $fillable = [
        'kpspams_id',
        'customer_id',
        'dusun_id',
        'meter_id',
        'connection_no',
        'address_detail',
        'latitude',
        'longitude',
        'status',
        'installed_date',
        'notes',
    ];

    protected $appends = [
        'connection_number',
    ];

    public function getConnectionNumberAttribute(): ?string
    {
        return $this->connection_no;
    }


    protected function casts(): array
    {
        return [
            'installed_date' => 'date',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function dusun(): BelongsTo
    {
        return $this->belongsTo(Dusun::class);
    }

    public function meter(): BelongsTo
    {
        return $this->belongsTo(Meter::class);
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
