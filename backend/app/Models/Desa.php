<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Desa extends Model
{
    protected $table = 'desa';

    protected $fillable = [
        'code',
        'name',
        'subdistrict',
        'district',
        'province',
        'postal_code',
        'office_address',
        'head_of_village',
        'phone',
        'email',
        'logo_path',
    ];

    public function dusuns(): HasMany
    {
        return $this->hasMany(Dusun::class);
    }

    public function kpspams(): HasMany
    {
        return $this->hasMany(Kpspams::class);
    }
}
