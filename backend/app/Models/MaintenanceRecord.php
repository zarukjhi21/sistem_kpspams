<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Traits\BelongsToKpspams;

class MaintenanceRecord extends Model
{
    use BelongsToKpspams;

    public $timestamps = false;

    protected $fillable = [
        'kpspams_id',
        'asset_id',
        'work_order_id',
        'record_number',
        'maintenance_type',
        'performed_date',
        'performed_by',
        'description',
        'cost',
        'next_maintenance_date',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'performed_date' => 'date',
            'next_maintenance_date' => 'date',
            'cost' => 'float',
            'created_at' => 'datetime',
        ];
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class);
    }
}
