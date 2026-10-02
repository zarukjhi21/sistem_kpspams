<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Traits\BelongsToKpspams;

class Tariff extends Model
{
    use BelongsToKpspams;

    protected $fillable = [
        'kpspams_id',
        'customer_type_id',
        'name',
        'effective_from',
        'effective_until',
        'status',
        'fixed_admin_fee',
        'maintenance_fee',
        'late_penalty_fee',
    ];

    protected function casts(): array
    {
        return [
            'effective_from' => 'date',
            'effective_until' => 'date',
            'fixed_admin_fee' => 'float',
            'maintenance_fee' => 'float',
            'late_penalty_fee' => 'float',
        ];
    }

    public function customerType(): BelongsTo
    {
        return $this->belongsTo(CustomerType::class);
    }

    public function components(): HasMany
    {
        return $this->hasMany(TariffComponent::class)->orderBy('tier_order');
    }
}
