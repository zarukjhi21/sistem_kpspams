<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Traits\BelongsToKpspams;

class KpspamsBillingPolicy extends Model
{
    use BelongsToKpspams;

    protected $fillable = [
        'kpspams_id',
        'due_day_of_month',
        'late_penalty_type',
        'late_penalty_amount',
        'sp1_arrears_months',
        'sp2_arrears_months',
        'disconnect_recommendation_months',
        'reconnect_fee',
        'is_auto_disconnect',
    ];

    protected function casts(): array
    {
        return [
            'due_day_of_month' => 'integer',
            'late_penalty_amount' => 'float',
            'sp1_arrears_months' => 'integer',
            'sp2_arrears_months' => 'integer',
            'disconnect_recommendation_months' => 'integer',
            'reconnect_fee' => 'float',
            'is_auto_disconnect' => 'boolean',
        ];
    }

    public function kpspams(): BelongsTo
    {
        return $this->belongsTo(Kpspams::class);
    }
}
