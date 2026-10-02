<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Traits\BelongsToKpspams;

class FinancialTransaction extends Model
{
    use BelongsToKpspams;

    protected $fillable = [
        'kpspams_id',
        'cash_account_id',
        'transaction_number',
        'transaction_date',
        'transaction_type',
        'category',
        'amount',
        'reference_type',
        'reference_id',
        'description',
        'receipt_attachment_path',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'transaction_date' => 'date',
            'amount' => 'float',
        ];
    }

    public function cashAccount(): BelongsTo
    {
        return $this->belongsTo(CashAccount::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
