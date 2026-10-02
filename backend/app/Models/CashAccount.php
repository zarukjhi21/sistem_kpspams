<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Traits\BelongsToKpspams;

class CashAccount extends Model
{
    use BelongsToKpspams;

    protected $fillable = [
        'kpspams_id',
        'account_code',
        'account_name',
        'bank_name',
        'account_number',
        'opening_balance',
        'opening_balance_date',
        'opening_balance_notes',
        'current_balance',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'opening_balance' => 'float',
            'opening_balance_date' => 'date',
            'current_balance' => 'float',
            'is_active' => 'boolean',
        ];
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function financialTransactions(): HasMany
    {
        return $this->hasMany(FinancialTransaction::class);
    }
}
