<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\Traits\BelongsToKpspams;

class Meter extends Model
{
    use BelongsToKpspams;

    protected $fillable = [
        'kpspams_id',
        'serial_number',
        'brand',
        'diameter_inch',
        'initial_reading',
        'installation_date',
        'condition',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'initial_reading' => 'float',
            'installation_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function connection(): HasOne
    {
        return $this->hasOne(Connection::class);
    }
}
