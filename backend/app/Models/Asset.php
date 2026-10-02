<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Traits\BelongsToKpspams;

class Asset extends Model
{
    use BelongsToKpspams;

    protected $fillable = [
        'kpspams_id',
        'category_id',
        'asset_code',
        'name',
        'location_description',
        'latitude',
        'longitude',
        'acquisition_year',
        'funding_source',
        'purchase_value',
        'condition',
        'status',
        'photo_path',
        'person_in_charge',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'acquisition_year' => 'integer',
            'purchase_value' => 'float',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class);
    }

    public function maintenanceRecords(): HasMany
    {
        return $this->hasMany(MaintenanceRecord::class);
    }
}
