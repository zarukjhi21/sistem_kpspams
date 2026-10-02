<?php

declare(strict_types=1);

namespace App\Models\Traits;

use App\Models\Scopes\KpspamsScope;
use App\Models\Kpspams;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToKpspams
{
    /**
     * Boot the trait to attach KpspamsScope and auto-assign kpspams_id on creation.
     */
    protected static function bootBelongsToKpspams(): void
    {
        static::addGlobalScope(new KpspamsScope);

        static::creating(function ($model) {
            if (auth()->check() && empty($model->kpspams_id)) {
                $user = auth()->user();
                if (!$user->isDesaLevel() && !$user->isSuperAdmin() && $user->kpspams_id) {
                    $model->kpspams_id = $user->kpspams_id;
                }
            }
        });
    }

    /**
     * Relasi ke entitas induk KPSPAMS.
     */
    public function kpspams(): BelongsTo
    {
        return $this->belongsTo(Kpspams::class, 'kpspams_id');
    }
}
