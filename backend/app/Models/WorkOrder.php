<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\Traits\BelongsToKpspams;

class WorkOrder extends Model
{
    use BelongsToKpspams;

    protected $fillable = [
        'kpspams_id',
        'complaint_id',
        'wo_number',
        'assigned_to_user_id',
        'scheduled_date',
        'start_time',
        'completion_time',
        'status',
        'before_photo_path',
        'after_photo_path',
        'action_taken',
        'labor_cost',
        'material_cost',
        'total_cost',
        'supervisor_notes',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_date' => 'date',
            'start_time' => 'datetime',
            'completion_time' => 'datetime',
            'labor_cost' => 'float',
            'material_cost' => 'float',
            'total_cost' => 'float',
        ];
    }

    public function complaint(): BelongsTo
    {
        return $this->belongsTo(Complaint::class);
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(WorkOrderItem::class);
    }

    public function maintenanceRecord(): HasOne
    {
        return $this->hasOne(MaintenanceRecord::class);
    }
}
