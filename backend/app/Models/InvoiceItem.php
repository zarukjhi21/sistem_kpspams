<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'invoice_id',
        'item_type',
        'description',
        'volume',
        'unit_rate',
        'total_price',
    ];

    protected function casts(): array
    {
        return [
            'volume' => 'float',
            'unit_rate' => 'float',
            'total_price' => 'float',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
