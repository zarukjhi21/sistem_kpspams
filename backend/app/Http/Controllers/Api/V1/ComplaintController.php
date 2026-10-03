<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Complaint;
use App\Models\WorkOrder;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ComplaintController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Complaint::with(['customer', 'connection.dusun', 'workOrder.technician']);

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->query('priority'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $s = $request->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('ticket_number', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%")
                  ->orWhereHas('customer', fn($sq) => $sq->where('full_name', 'like', "%{$s}%"));
            });
        }

        $complaints = $query->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 20));

        return $this->sendResponse($complaints->items(), 'Daftar pengaduan warga berhasil dimuat.', 200, [
            'current_page' => $complaints->currentPage(),
            'last_page' => $complaints->lastPage(),
            'total' => $complaints->total(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $complaint = Complaint::with(['customer', 'connection.dusun', 'connection.meter', 'workOrder.items.inventoryItem', 'workOrder.technician'])
            ->findOrFail($id);

        return $this->sendResponse($complaint, 'Detail pengaduan warga berhasil dimuat.');
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|exists:customers,id',
            'connection_id' => 'nullable|exists:connections,id',
            'category' => 'required|in:AIR_KERUH,PIPA_BOCOR,METER_RUSAK,TEKANAN_RENDAH,TAGIHAN_TIDAK_SESUAI,LAINNYA',
            'description' => 'required|string|min:10',
            'photo' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'priority' => 'nullable|in:LOW,MEDIUM,HIGH,EMERGENCY',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi pengaduan gagal.', $validator->errors(), 422);
        }

        $user = $request->user();
        $customerId = (int) $request->input('customer_id');

        // IDOR Defense: Pelanggan can only create complaints for their own customer record
        if ($user->hasRole('pelanggan') || $user->customer_id) {
            $customerId = (int) $user->customer_id;
        }

        $kpspamsId = $user->kpspams_id;

        if (!$kpspamsId && $request->filled('kpspams_id')) {
            $kpspamsId = (int) $request->input('kpspams_id');
        }

        if (!$kpspamsId) {
            return $this->sendError('KPSPAMS wajib ditentukan.', [], 400);
        }

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('complaint_photos', 'public');
        }

        $ticketNumber = 'TKT/' . now()->format('Ymd') . '/' . strtoupper(bin2hex(random_bytes(3)));

        $complaint = Complaint::create([
            'kpspams_id' => $kpspamsId,
            'customer_id' => $customerId,
            'connection_id' => $request->input('connection_id'),
            'ticket_number' => $ticketNumber,
            'category' => $request->input('category'),
            'description' => $request->input('description'),
            'photo_path' => $photoPath,
            'latitude' => $request->input('latitude'),
            'longitude' => $request->input('longitude'),
            'priority' => $request->input('priority', 'MEDIUM'),
            'status' => 'SUBMITTED',
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $kpspamsId,
            'action' => 'CREATE_COMPLAINT',
            'entity' => 'Complaint',
            'entity_id' => $complaint->id,
            'new_values' => $complaint->toArray(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($complaint, 'Tiket pengaduan warga berhasil dibuat.', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $complaint = Complaint::findOrFail($id);

        // IDOR / RBAC Defense for updating complaints
        if ($user->hasRole('pelanggan') || $user->customer_id) {
            if ($complaint->customer_id !== $user->customer_id) {
                return $this->sendError('Akses ditolak: Anda tidak memiliki wewenang untuk mengubah pengaduan pelanggan lain.', [], 403);
            }
            if ($complaint->status !== 'SUBMITTED') {
                return $this->sendError('Pengaduan yang sedang diproses atau sudah selesai tidak dapat diubah.', [], 422);
            }
        } elseif (!$user->isSuperAdmin() && !$user->isDesaLevel()) {
            if ($complaint->kpspams_id !== $user->kpspams_id) {
                return $this->sendError('Akses ditolak: Pengaduan berada di luar unit KPSPAMS Anda.', [], 403);
            }
        }

        $validator = Validator::make($request->all(), [
            'priority' => 'sometimes|in:LOW,MEDIUM,HIGH,EMERGENCY',
            'description' => 'sometimes|string|min:10',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi pembaruan gagal.', $validator->errors(), 422);
        }

        $old = $complaint->toArray();
        $complaint->update($request->only(['priority', 'description']));

        AuditLog::create([
            'user_id' => $request->user()->id,
            'kpspams_id' => $complaint->kpspams_id,
            'action' => 'UPDATE_COMPLAINT',
            'entity' => 'Complaint',
            'entity_id' => $complaint->id,
            'old_values' => $old,
            'new_values' => $complaint->getChanges(),
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($complaint, 'Data pengaduan berhasil diperbarui.');
    }

    public function verify(Request $request, int $id): JsonResponse
    {
        $complaint = Complaint::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:VERIFIED,REJECTED',
            'rejection_reason' => 'required_if:status,REJECTED|nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi verifikasi gagal.', $validator->errors(), 422);
        }

        $user = $request->user();
        $status = $request->input('status');

        $complaint->update([
            'status' => $status,
            'rejection_reason' => ($status === 'REJECTED') ? $request->input('rejection_reason') : null,
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'kpspams_id' => $complaint->kpspams_id,
            'action' => 'VERIFY_COMPLAINT',
            'entity' => 'Complaint',
            'entity_id' => $complaint->id,
            'new_values' => ['status' => $status, 'rejection_reason' => $complaint->rejection_reason],
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->sendResponse($complaint, "Pengaduan warga berhasil ditandai sebagai {$status}.");
    }

    public function createWorkOrder(Request $request, int $id): JsonResponse
    {
        $complaint = Complaint::findOrFail($id);

        if ($complaint->status === 'REJECTED') {
            return $this->sendError('Pengaduan yang ditolak tidak dapat dibuatkan SPK.', [], 400);
        }

        if ($complaint->workOrder) {
            return $this->sendError('SPK untuk pengaduan ini sudah pernah dibuat sebelumnya.', [], 409);
        }

        $validator = Validator::make($request->all(), [
            'assigned_to_user_id' => 'required|exists:users,id',
            'scheduled_date' => 'required|date',
            'supervisor_notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validasi SPK gagal.', $validator->errors(), 422);
        }

        $user = $request->user();

        $workOrder = DB::transaction(function () use ($complaint, $request, $user) {
            $woNumber = 'SPK/' . now()->format('Ymd') . '/' . strtoupper(bin2hex(random_bytes(3)));

            $wo = WorkOrder::create([
                'kpspams_id' => $complaint->kpspams_id,
                'complaint_id' => $complaint->id,
                'wo_number' => $woNumber,
                'assigned_to_user_id' => $request->input('assigned_to_user_id'),
                'scheduled_date' => $request->input('scheduled_date'),
                'status' => 'ASSIGNED',
                'supervisor_notes' => $request->input('supervisor_notes'),
            ]);

            $complaint->update(['status' => 'IN_PROGRESS']);

            AuditLog::create([
                'user_id' => $user->id,
                'kpspams_id' => $complaint->kpspams_id,
                'action' => 'CREATE_WORK_ORDER_FROM_COMPLAINT',
                'entity' => 'WorkOrder',
                'entity_id' => $wo->id,
                'new_values' => $wo->toArray(),
                'ip_address' => $request->ip() ?? '127.0.0.1',
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return $wo;
        });

        return $this->sendResponse($workOrder->load(['complaint', 'technician']), 'Surat Perintah Kerja (SPK) teknisi berhasil diterbitkan.', 201);
    }
}
