<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class InventoryController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = InventoryItem::with(['kpspams']);

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        if ($request->boolean('low_stock_only')) {
            $query->whereColumn('current_stock', '<=', 'min_stock');
        }

        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('name', 'ilike', "%{$s}%")
                  ->orWhere('code', 'like', "%{$s}%");
            });
        }

        $items = $query->orderBy('name')->paginate($request->integer('per_page', 20));

        return $this->sendResponse($items->items(), 'Daftar inventaris material & suku cadang berhasil dimuat.', 200, [
            'current_page' => $items->currentPage(),
            'last_page' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function storeTransaction(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'transaction_type' => 'required|in:IN,OUT,ADJUSTMENT',
            'quantity' => 'required|integer|min:1',
            'notes' => 'required|string|min:5',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi mutasi inventaris gagal.', $validator->errors(), 422);
        }

        $user = $request->user();

        $tx = DB::transaction(function () use ($request, $user) {
            $item = InventoryItem::where('id', $request->input('inventory_item_id'))->lockForUpdate()->firstOrFail();
            $type = $request->input('transaction_type');
            $qty = (int) $request->input('quantity');

            $stockBefore = $item->current_stock;

            if ($type === 'OUT') {
                if ($stockBefore < $qty) {
                    throw new \Exception("Stok tidak mencukupi untuk dikeluarkan. Stok saat ini: {$stockBefore}, diminta: {$qty}.");
                }
                $stockAfter = $stockBefore - $qty;
            } elseif ($type === 'IN') {
                $stockAfter = $stockBefore + $qty;
            } else { // ADJUSTMENT
                $stockAfter = $qty; // jika adjustment, qty dianggap stok aktual hasil opname
            }

            $item->update(['current_stock' => $stockAfter]);

            $tx = InventoryTransaction::create([
                'kpspams_id' => $item->kpspams_id,
                'inventory_item_id' => $item->id,
                'transaction_type' => $type,
                'reference_type' => 'MANUAL_ADJUSTMENT',
                'reference_id' => null,
                'quantity' => ($type === 'ADJUSTMENT') ? abs($stockAfter - $stockBefore) : $qty,
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter,
                'notes' => $request->input('notes'),
                'created_by' => $user->id,
                'created_at' => now(),
            ]);

            AuditLog::create([
                'user_id' => $user->id,
                'kpspams_id' => $item->kpspams_id,
                'action' => 'STORE_INVENTORY_TRANSACTION',
                'entity' => 'InventoryTransaction',
                'entity_id' => $tx->id,
                'new_values' => $tx->toArray(),
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            return $tx;
        });

        return $this->sendResponse($tx->load('inventoryItem'), 'Mutasi inventaris berhasil dicatat.', 201);
    }
}
