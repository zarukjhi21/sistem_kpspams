<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\Traits\BelongsToKpspams;

class Payment extends Model
{
    use BelongsToKpspams;

    protected $fillable = [
        'kpspams_id',
        'invoice_id',
        'customer_id',
        'cash_account_id',
        'received_by_user_id',
        'receipt_number',
        'payment_date',
        'amount_paid',
        'payment_method',
        'reference_number',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'payment_date' => 'datetime',
            'amount_paid' => 'float',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function cashAccount(): BelongsTo
    {
        return $this->belongsTo(CashAccount::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by_user_id');
    }

    public function reversal(): HasOne
    {
        return $this->hasOne(PaymentReversal::class);
    }
}
