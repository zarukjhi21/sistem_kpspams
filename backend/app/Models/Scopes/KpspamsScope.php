<?php

declare(strict_types=1);

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class KpspamsScope implements Scope
{
    /**
     * Apply the multi-KPSPAMS isolation scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (!auth()->check()) {
            return;
        }

        /** @var \App\Models\User $user */
        $user = auth()->user();

        // 1. Super Admin dan Aparatur Desa (Admin Desa, Pemerintah Desa) memiliki akses agregat seluruh KPSPAMS
        if ($user->isSuperAdmin() || $user->isDesaLevel()) {
            // Jika ada query filter eksplisit kpspams_id, gunakan filter tersebut
            if (request()->filled('kpspams_id')) {
                $builder->where($model->getTable() . '.kpspams_id', request()->query('kpspams_id'));
            }
            return;
        }

        // 2. Pengguna level KPSPAMS (Ketua, Admin, Bendahara, Petugas Lapangan)
        // TERKUNCI SECARA MUTLAK pada kpspams_id miliknya
        if ($user->kpspams_id) {
            $builder->where($model->getTable() . '.kpspams_id', $user->kpspams_id);
            return;
        }

        // 3. Jika pengguna pelanggan (customer), dikunci pada customer_id miliknya jika model memiliki relasi
        if ($user->customer_id && in_array('customer_id', $model->getFillable())) {
            $builder->where($model->getTable() . '.customer_id', $user->customer_id);
        }
    }
}
