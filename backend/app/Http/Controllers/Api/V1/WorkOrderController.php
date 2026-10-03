<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\WorkOrder;
use App\Models\WorkOrderItem;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class WorkOrderController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = WorkOrder::with(['complaint.customer', 'technician', 'items.inventoryItem']);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('technician_id')) {
            $query->where('assigned_to_user_id', $request->query('technician_id'));
        }

        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('wo_number', 'like', "%{$s}%")
                  ->orWhere('action_taken', 'like', "%{$s}%");
            });
        }

        $orders = $query->orderBy('scheduled_date', 'desc')
            ->paginate($request->integer('per_page', 20));

        return $this->sendResponse($orders->items(), 'Daftar Surat Perintah Kerja (SPK) berhasil dimuat.', 200, [
            'current_page' => $orders->currentPage(),
            'last_page' => $orders->lastPage(),
            'total' => $orders->total(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $order = WorkOrder::with([
            'complaint.customer',
            'complaint.connection.dusun',
            'technician',
            'items.inventoryItem',
            'maintenanceRecord.asset'
        ])->findOrFail($id);

        return $this->sendResponse($order, 'Detail Surat Perintah Kerja (SPK) berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'complaint_id' => 'nullable|exists:complaints,id',
            'assigned_to_user_id' => 'required|exists:users,id',
            'scheduled_date' => 'required|date',
            'supervisor_notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi SPK gagal.', $validator->errors(), 422);
        }

        $user = $request->user();
        $kpspamsId = $user->kpspams_id;

        if (!$kpspamsId && $request->filled('kpspams_id')) {
            $kpspamsId = (int) $request->input('kpspams_id');
        }

        if (!$kpspamsId) {
            return $this->sendError('KPSPAMS wajib ditentukan.', [], 400);
        }

        $woNumber = 'SPK/' . now()->format('Ymd') . '/' . strtoupper(bin2hex(random_bytes(3)));

        $wo = WorkOrder::create([
            'kpspams_id' => $kpspamsId,
            'complaint_id' => $request->input('complaint_id'),
            'wo_number' => $woNumber,
            'assigned_to_user_id' => $request->input('assigned_to_user_id'),
            'scheduled_date' => $request->input('scheduled_date'),
            'status' => 'ASSIGNED',
            'supervisor_notes' => $request->input('supervisor_notes'),
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $kpspamsId,
            'action' => 'CREATE_WORK_ORDER',
            'entity' => 'WorkOrder',
            'entity_id' => $wo->id,
            'new_values' => $wo->toArray(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($wo->load(['technician']), 'SPK baru berhasil diterbitkan.', 201);
    }

    public function start(Request $request, int $id): JsonResponse
    {
        $order = WorkOrder::findOrFail($id);

        if ($order->status !== 'ASSIGNED') {
            return $this->sendError("SPK tidak dapat dimulai karena berstatus {$order->status}.", [], 400);
        }

        $order->update([
            'status' => 'IN_PROGRESS',
            'start_time' => now(),
        ]);

        return $this->sendResponse($order, 'Pekerjaan SPK telah dimulai.');
    }

    public function complete(Request $request, int $id): JsonResponse
    {
        $order = WorkOrder::with('complaint')->findOrFail($id);

        if ($order->status === 'COMPLETED') {
            return $this->sendError('SPK ini sudah berstatus selesai.', [], 400);
        }

        $validator = Validator::make($request->all(), [
            'action_taken' => 'required|string|min:10',
            'labor_cost' => 'nullable|numeric|min:0',
            'before_photo' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
            'after_photo' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
            'used_items' => 'nullable|array',
            'used_items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'used_items.*.quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi penyelesaian SPK gagal.', $validator->errors(), 422);
        }

        $user = $request->user();

        $beforePhotoPath = $order->before_photo_path;
        if ($request->hasFile('before_photo')) {
            $beforePhotoPath = $request->file('before_photo')->store('work_order_photos', 'public');
        }

        $afterPhotoPath = null;
        if ($request->hasFile('after_photo')) {
            $afterPhotoPath = $request->file('after_photo')->store('work_order_photos', 'public');
        }

        $order = DB::transaction(function () use ($order, $request, $user, $beforePhotoPath, $afterPhotoPath) {
            $laborCost = (float) $request->input('labor_cost', 0);
            $materialCost = 0.0;

            if ($request->filled('used_items')) {
                foreach ($request->input('used_items') as $used) {
                    $item = InventoryItem::where('id', $used['inventory_item_id'])->lockForUpdate()->firstOrFail();
                    $qty = (int) $used['quantity'];

                    if ($item->current_stock < $qty) {
                        throw new \Exception("Stok material {$item->name} tidak mencukupi (Tersedia: {$item->current_stock}, Dibutuhkan: {$qty}).");
                    }

                    $stockBefore = $item->current_stock;
                    $stockAfter = $stockBefore - $qty;
                    $itemTotalCost = $qty * (float) $item->unit_price;
                    $materialCost += $itemTotalCost;

                    // Deduct stock
                    $item->update(['current_stock' => $stockAfter]);

                    // Create WorkOrderItem
                    WorkOrderItem::create([
                        'work_order_id' => $order->id,
                        'inventory_item_id' => $item->id,
                        'quantity_used' => $qty,
                        'unit_cost' => $item->unit_price,
                        'total_cost' => $itemTotalCost,
                    ]);

                    // Record InventoryTransaction
                    InventoryTransaction::create([
                        'kpspams_id' => $order->kpspams_id,
                        'inventory_item_id' => $item->id,
                        'transaction_type' => 'OUT',
                        'reference_type' => 'WORK_ORDER',
                        'reference_id' => $order->id,
                        'quantity' => $qty,
                        'stock_before' => $stockBefore,
                        'stock_after' => $stockAfter,
                        'notes' => "Penggunaan material SPK {$order->wo_number}",
                        'created_by' => $user->id,
                        'created_at' => now(),
                    ]);
                }
            }

            $totalCost = $laborCost + $materialCost;

            $order->update([
                'status' => 'COMPLETED',
                'completion_time' => now(),
                'action_taken' => $request->input('action_taken'),
                'labor_cost' => $laborCost,
                'material_cost' => $materialCost,
                'total_cost' => $totalCost,
                'before_photo_path' => $beforePhotoPath,
                'after_photo_path' => $afterPhotoPath,
            ]);

            // Jika terhubung ke pengaduan warga, selesaikan tiket pengaduan
            if ($order->complaint) {
                $order->complaint->update([
                    'status' => 'RESOLVED',
                    'resolved_at' => now(),
                ]);
            }

            AuditLog::create([
                'user_id' => $user->id,
                'kpspams_id' => $order->kpspams_id,
                'action' => 'COMPLETE_WORK_ORDER',
                'entity' => 'WorkOrder',
                'entity_id' => $order->id,
                'new_values' => [
                    'status' => 'COMPLETED',
                    'action_taken' => $order->action_taken,
                    'total_cost' => $totalCost,
                ],
                'ip_address' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);

            return $order;
        });

        return $this->sendResponse($order->load(['items.inventoryItem', 'complaint']), 'Surat Perintah Kerja (SPK) berhasil diselesaikan dan stok material telah diperbarui.');
    }
}
