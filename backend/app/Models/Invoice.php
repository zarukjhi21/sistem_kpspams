<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Traits\BelongsToKpspams;

class Invoice extends Model
{
    use BelongsToKpspams;

    protected $fillable = [
        'kpspams_id',
        'billing_period_id',
        'connection_id',
        'customer_id',
        'meter_reading_id',
        'invoice_number',
        'invoice_date',
        'due_date',
        'usage_m3',
        'water_amount',
        'admin_fee',
        'maintenance_fee',
        'penalty_fee',
        'total_amount',
        'paid_amount',
        'balance_due',
        'status',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'invoice_date' => 'date',
            'due_date' => 'date',
            'usage_m3' => 'float',
            'water_amount' => 'float',
            'admin_fee' => 'float',
            'maintenance_fee' => 'float',
            'penalty_fee' => 'float',
            'total_amount' => 'float',
            'paid_amount' => 'float',
            'balance_due' => 'float',
            'paid_at' => 'datetime',
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

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function meterReading(): BelongsTo
    {
        return $this->belongsTo(MeterReading::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
