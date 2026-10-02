<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\Traits\BelongsToKpspams;

class Complaint extends Model
{
    use BelongsToKpspams;

    protected $fillable = [
        'kpspams_id',
        'customer_id',
        'connection_id',
        'ticket_number',
        'category',
        'description',
        'photo_path',
        'latitude',
        'longitude',
        'priority',
        'status',
        'rejection_reason',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'resolved_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function connection(): BelongsTo
    {
        return $this->belongsTo(Connection::class);
    }

    public function workOrder(): HasOne
    {
        return $this->hasOne(WorkOrder::class);
    }
}
