<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TariffComponent extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'tariff_id',
        'tier_order',
        'tier_min_m3',
        'tier_max_m3',
        'rate_per_m3',
    ];

    protected function casts(): array
    {
        return [
            'tier_order' => 'integer',
            'tier_min_m3' => 'integer',
            'tier_max_m3' => 'integer',
            'rate_per_m3' => 'float',
        ];
    }

    public function tariff(): BelongsTo
    {
        return $this->belongsTo(Tariff::class);
    }
}
