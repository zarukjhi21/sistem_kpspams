<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Kpspams extends Model
{
    use SoftDeletes;

    protected $table = 'kpspams';

    protected $fillable = [
        'desa_id',
        'code',
        'name',
        'decree_number',
        'established_date',
        'office_address',
        'contact_phone',
        'contact_email',
        'bank_account_info',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'established_date' => 'date',
        ];
    }

    public function desa(): BelongsTo
    {
        return $this->belongsTo(Desa::class);
    }

    public function dusuns(): BelongsToMany
    {
        return $this->belongsToMany(Dusun::class, 'kpspams_dusun')
            ->withPivot('assigned_date', 'is_primary')
            ->withTimestamps();
    }

    public function billingPolicy(): HasOne
    {
        return $this->hasOne(KpspamsBillingPolicy::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function connections(): HasMany
    {
        return $this->hasMany(Connection::class);
    }

    public function tariffs(): HasMany
    {
        return $this->hasMany(Tariff::class);
    }

    public function cashAccounts(): HasMany
    {
        return $this->hasMany(CashAccount::class);
    }
}
