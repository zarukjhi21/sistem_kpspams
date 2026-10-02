<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dusun extends Model
{
    protected $table = 'dusun';

    protected $fillable = [
        'desa_id',
        'code',
        'name',
        'notes',
    ];

    public function desa(): BelongsTo
    {
        return $this->belongsTo(Desa::class);
    }

    public function kpspams(): BelongsToMany
    {
        return $this->belongsToMany(Kpspams::class, 'kpspams_dusun')
            ->withPivot('assigned_date', 'is_primary')
            ->withTimestamps();
    }

    public function connections(): HasMany
    {
        return $this->hasMany(Connection::class);
    }
}
