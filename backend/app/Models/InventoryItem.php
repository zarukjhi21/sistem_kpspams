<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Traits\BelongsToKpspams;

class InventoryItem extends Model
{
    use BelongsToKpspams;

    protected $fillable = [
        'kpspams_id',
        'code',
        'name',
        'category',
        'unit',
        'min_stock',
        'current_stock',
        'unit_price',
    ];

    protected function casts(): array
    {
        return [
            'min_stock' => 'integer',
            'current_stock' => 'integer',
            'unit_price' => 'float',
        ];
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(InventoryTransaction::class);
    }
}
