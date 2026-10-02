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

        // 2. Pengguna pelanggan (Customer IDOR / BOLA Strict Scope)
        // Pelanggan HANYA boleh mengakses data miliknya sendiri
        if ($user->hasRole('pelanggan') || $user->customer_id) {
            $customerId = $user->customer_id;

            if ($model instanceof \App\Models\Customer) {
                $builder->where($model->getTable() . '.id', $customerId);
                return;
            }

            if ($model instanceof \App\Models\Connection) {
                $builder->where($model->getTable() . '.customer_id', $customerId);
                return;
            }

            if ($model instanceof \App\Models\Invoice || $model instanceof \App\Models\Payment || $model instanceof \App\Models\Complaint) {
                $builder->where($model->getTable() . '.customer_id', $customerId);
                return;
            }

            if ($model instanceof \App\Models\MeterReading) {
                $builder->whereHas('connection', function ($q) use ($customerId) {
                    $q->where('customer_id', $customerId);
                });
                return;
            }

            // Pelanggan TIDAK memiliki akses ke Asset, FinancialTransaction, Inventory, CashAccount, WorkOrder internal
            if (in_array(get_class($model), [
                \App\Models\Asset::class,
                \App\Models\CashAccount::class,
                \App\Models\FinancialTransaction::class,
                \App\Models\InventoryItem::class,
                \App\Models\InventoryTransaction::class,
                \App\Models\WorkOrder::class,
            ])) {
                $builder->whereRaw('1 = 0');
                return;
            }
        }

        // 3. Pengguna level KPSPAMS (Ketua, Admin, Bendahara, Petugas Lapangan)
        // TERKUNCI SECARA MUTLAK pada kpspams_id miliknya
        if ($user->kpspams_id) {
            $builder->where($model->getTable() . '.kpspams_id', $user->kpspams_id);
            return;
        }
    }
}
