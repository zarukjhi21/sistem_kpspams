<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Traits\BelongsToKpspams;

class Customer extends Model
{
    use SoftDeletes, BelongsToKpspams;

    protected $fillable = [
        'kpspams_id',
        'customer_type_id',
        'code',
        'nik',
        'no_kk',
        'full_name',
        'birth_place_date',
        'gender',
        'phone',
        'email',
        'identity_address',
        'rt_rw',
        'dusun',
        'village',
        'district',
        'religion',
        'marital_status',
        'occupation',
        'ktp_photo_path',
        'status',
        'registration_date',
    ];

    protected function casts(): array
    {
        return [
            'registration_date' => 'date',
        ];
    }

    public function customerType(): BelongsTo
    {
        return $this->belongsTo(CustomerType::class);
    }

    public function connections(): HasMany
    {
        return $this->hasMany(Connection::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class);
    }
}
