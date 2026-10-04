"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";
import {
  AlertCircle,
  Wrench,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  PlusCircle,
  FileText,
  Search,
  Filter,
  Phone,
  Sparkles,
  X,
  Send,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface ComplaintItem {
  id: number;
  ticketNumber: string;
  kpspamsId: number;
  kpspamsName: string;
  customerName: string;
  customerCode: string;
  dusunName: string;
  phone: string;
  category: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
  status: "OPEN" | "SUBMITTED" | "VERIFIED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  createdAt: string;
  technicianName?: string;
  spkNumber?: string;
  workOrderId?: number;
}

interface TechnicianUser {
  id: number;
  name: string;
  username: string;
  kpspams_id?: number;
}

export default function PengaduanPage() {
  return (
    <DashboardLayout>
      <PengaduanContent />
    </DashboardLayout>
  );
}

function PengaduanContent() {
  const { activeKpspamsId, user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [selectedTicket, setSelectedTicket] = useState<ComplaintItem | null>(null);
  const [showSpkModal, setShowSpkModal] = useState<boolean>(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number>(7);
  const [spkNotes, setSpkNotes] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Ambil data Pengaduan dari API Backend
  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = "/complaints?per_page=100";
      const res = await apiClient(url);
      if (res?.status === "success" && Array.isArray(res.data)) {
        const mapped: ComplaintItem[] = res.data.map((c: any) => ({
          id: Number(c.id),
          ticketNumber: c.ticket_number,
          kpspamsId: Number(c.kpspams_id || 1),
          kpspamsName: c.kpspams?.name || (Number(c.kpspams_id) === 1 ? "KPSPAMS Lemo Baru" : c.kpspams_id === 2 ? "KPSPAMS Lemo Tua" : "KPSPAMS Sarampu 1"),
          customerName: c.customer?.full_name || "Warga",
          customerCode: c.customer?.code || "CUST-000",
          dusunName: c.connection?.dusun?.name || "Desa Kuajang",
          phone: c.customer?.phone || "-",
          category: c.category || "LAINNYA",
          description: c.description,
          priority: c.priority || "MEDIUM",
          status: c.status,
          createdAt: c.created_at ? new Date(c.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "-",
          technicianName: c.work_order?.technician?.name,
          spkNumber: c.work_order?.wo_number,
          workOrderId: c.work_order?.id,
        }));
        setComplaints(mapped);
      }
    } catch (err) {
      console.warn("API pengaduan offline, menggunakan data fallback:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ambil daftar petugas lapangan / teknisi resmi
  const fetchTechnicians = useCallback(async () => {
    try {
      const res = await apiClient("/users?per_page=50");
      if (res?.status === "success" && Array.isArray(res.data)) {
        const fieldStaff = res.data
          .filter((u: any) =>
            u.roles?.some((r: any) => r.name === "petugas_lapangan" || r.name === "admin_kpspams" || r.name === "super_admin")
          )
          .map((u: any) => ({
            id: u.id,
            name: u.name,
            username: u.username,
            kpspams_id: u.kpspams_id,
          }));
        if (fieldStaff.length > 0) {
          setTechnicians(fieldStaff);
          setSelectedTechnicianId(fieldStaff[0].id);
        }
      }
    } catch (err) {
      console.warn("Gagal memuat daftar teknisi:", err);
      // Fallback default
      setTechnicians([
        { id: 7, name: "Syamsul Bahri (Petugas Lapangan LMB)", username: "petugas.lemobaru" },
        { id: 11, name: "Kamaruddin (Petugas Lapangan LMT)", username: "petugas.lemotua" },
        { id: 15, name: "Ilham Syarif (Petugas Lapangan SR1)", username: "petugas.sarampu1" },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
    fetchTechnicians();
  }, [fetchComplaints, fetchTechnicians]);

  const filtered = complaints.filter((c) => {
    if (activeKpspamsId !== null && Number(c.kpspamsId) !== Number(activeKpspamsId)) {
      return false;
    }
    if (statusFilter !== "ALL") {
      if (statusFilter === "OPEN_SUBMITTED" && (c.status === "OPEN" || c.status === "SUBMITTED")) return true;
      if (c.status !== statusFilter) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        c.ticketNumber.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleOpenSpkModal = (ticket: ComplaintItem) => {
    setSelectedTicket(ticket);
    setSpkNotes(`Perbaikan gangguan ${ticket.category.replace(/_/g, " ")} di ${ticket.dusunName} atas nama ${ticket.customerName}.`);
    setShowSpkModal(true);
  };

  const handleCreateSpk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await apiClient(`/complaints/${selectedTicket.id}/create-work-order`, {
        method: "POST",
        body: JSON.stringify({
          assigned_to_user_id: selectedTechnicianId,
          scheduled_date: new Date().toISOString().split("T")[0],
          supervisor_notes: spkNotes,
        }),
      });

      const assignedTech = technicians.find((t) => t.id === selectedTechnicianId)?.name || "Teknisi Lapangan";
      const spkNo = res?.data?.wo_number || "SPK-TERBIT";

      setSuccessMsg(`SPK resmi nomor ${spkNo} berhasil diterbitkan di database server untuk teknisi ${assignedTech}.`);
      setShowSpkModal(false);
      await fetchComplaints();
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: any) {
      const msg = err?.message || "Gagal menerbitkan SPK ke server.";
      setErrorMsg(msg);
      // Fallback update
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === selectedTicket.id
            ? { ...c, status: "IN_PROGRESS", spkNumber: `SPK-${Date.now().toString().slice(-4)}` }
            : c
        )
      );
      setShowSpkModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveTicket = async (ticket: ComplaintItem) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (ticket.workOrderId) {
        await apiClient(`/work-orders/${ticket.workOrderId}/complete`, {
          method: "POST",
          body: JSON.stringify({
            action_taken: "Pekerjaan lapangan telah selesai ditangani dan diverifikasi dengan baik.",
            notes: "Ditandai selesai dari portal operasional.",
          }),
        });
      } else {
        await apiClient(`/complaints/${ticket.id}/verify`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "RESOLVED",
          }),
        });
      }

      setSuccessMsg(`Tiket ${ticket.ticketNumber} berhasil ditandai SELESAI di basis data server.`);
      await fetchComplaints();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      const msg = err?.message || "Gagal memperbarui status di server.";
      setErrorMsg(msg);
      setComplaints((prev) =>
        prev.map((c) => (c.id === ticket.id ? { ...c, status: "RESOLVED" } : c))
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyTicket = async (ticketId: number) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await apiClient(`/complaints/${ticketId}/verify`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "VERIFIED",
        }),
      });
      setSuccessMsg("Tiket pengaduan berhasil diverifikasi.");
      await fetchComplaints();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal memverifikasi tiket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-maroon-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-brand-maroon-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-brand-gold-500/20 text-brand-gold-400 text-[11px] font-bold mb-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Respons Cepat Gangguan Air Bersih Terpadu</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Pengaduan Layanan & SPK Teknisi
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Penerimaan tiket keluhan, penerbitan Surat Perintah Kerja (SPK), dan pemantauan perbaikan pipa secara realtime terhubung ke database.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="text-xs self-start sm:self-center font-bold"
          onClick={() => {
            fetchComplaints();
            fetchTechnicians();
          }}
          disabled={isLoading}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
        >
          Muat Ulang
        </Button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4">
          <div className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Total Masuk</div>
          <div className="mt-1 text-2xl font-black text-slate-900 font-tabular">{filtered.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Semua kategori tiket</div>
        </Card>

        <Card className="p-4">
          <div className="text-[10px] sm:text-xs text-amber-700 font-bold uppercase tracking-wider">Menunggu Penanganan</div>
          <div className="mt-1 text-2xl font-black text-amber-800 font-tabular">
            {filtered.filter((c) => c.status === "OPEN" || c.status === "SUBMITTED" || c.status === "VERIFIED").length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Perlu diverifikasi / dibuatkan SPK</div>
        </Card>

        <Card className="p-4">
          <div className="text-[10px] sm:text-xs text-blue-700 font-bold uppercase tracking-wider">SPK Pengerjaan</div>
          <div className="mt-1 text-2xl font-black text-blue-800 font-tabular">
            {filtered.filter((c) => c.status === "IN_PROGRESS").length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Teknisi di lapangan</div>
        </Card>

        <Card className="p-4">
          <div className="text-[10px] sm:text-xs text-emerald-700 font-bold uppercase tracking-wider">Telah Selesai</div>
          <div className="mt-1 text-2xl font-black text-emerald-800 font-tabular">
            {filtered.filter((c) => c.status === "RESOLVED").length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Layanan normal kembali</div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tiket, pelanggan, deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white w-full sm:w-auto font-medium"
            >
              <option value="ALL">Semua Status Tiket</option>
              <option value="OPEN_SUBMITTED">Menunggu Verifikasi</option>
              <option value="VERIFIED">Terverifikasi</option>
              <option value="IN_PROGRESS">SPK Diterbitkan</option>
              <option value="RESOLVED">Selesai</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Loading state indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-10 space-x-2 text-slate-500 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-brand-maroon-700" />
          <span>Memuat data pengaduan dari server database...</span>
        </div>
      )}

      {/* Mobile Card View (< md) */}
      {!isLoading && (
        <div className="md:hidden space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-brand-maroon-900 bg-brand-maroon-50 px-2 py-0.5 rounded-md border border-brand-maroon-200">
                  {item.ticketNumber}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.priority === "HIGH" || item.priority === "EMERGENCY"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {item.priority}
                </span>
              </div>

              <div>
                <div className="font-bold text-slate-900 text-sm">{item.customerName}</div>
                <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.dusunName}</span>
                  <span>•</span>
                  <span className="font-mono">{item.customerCode}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="font-bold text-slate-700">{item.category.replace(/_/g, " ")}</div>
                <div className="text-slate-600 text-[11px] leading-relaxed">{item.description}</div>
                {item.spkNumber && (
                  <div className="mt-1 text-[10px] text-blue-700 font-semibold flex items-center space-x-1 pt-1 border-t border-slate-200">
                    <Wrench className="w-3 h-3" />
                    <span>{item.spkNumber} ({item.technicianName || "Teknisi Lapangan"})</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex flex-col gap-2">
                {(item.status === "OPEN" || item.status === "SUBMITTED") && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full font-bold"
                    onClick={() => handleVerifyTicket(item.id)}
                    disabled={isSubmitting}
                  >
                    Verifikasi Laporan
                  </Button>
                )}

                {item.status === "OPEN" || item.status === "SUBMITTED" || item.status === "VERIFIED" ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full font-bold"
                    icon={<Wrench className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenSpkModal(item)}
                    disabled={isSubmitting}
                  >
                    Terbitkan SPK Teknisi
                  </Button>
                ) : item.status === "IN_PROGRESS" ? (
                  <Button
                    variant="gold"
                    size="sm"
                    className="w-full font-bold"
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={() => handleResolveTicket(item)}
                    disabled={isSubmitting}
                  >
                    Selesaikan Tiket
                  </Button>
                ) : (
                  <div className="w-full text-center py-1 text-xs text-emerald-700 font-bold bg-emerald-50 rounded-xl border border-emerald-200">
                    ✓ Penanganan Selesai
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400 bg-white rounded-2xl border border-slate-100">
              Tidak ada data pengaduan yang sesuai filter.
            </div>
          )}
        </div>
      )}

      {/* Desktop Table View (>= md) */}
      {!isLoading && (
        <div className="hidden md:block">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">No. Tiket</th>
                    <th className="px-4 py-3">Pelanggan & Lokasi</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Keluhan & Catatan</th>
                    <th className="px-4 py-3">Prioritas</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-[11px] font-bold text-slate-900">
                          {item.ticketNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.createdAt}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{item.customerName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.dusunName} • {item.customerCode}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.category.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="text-slate-700 leading-snug line-clamp-2">{item.description}</div>
                        {item.spkNumber && (
                          <div className="mt-1 text-[10px] text-blue-700 font-medium flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            {item.spkNumber} ({item.technicianName || "Teknisi Lapangan"})
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.priority === "HIGH" || item.priority === "EMERGENCY"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : item.priority === "MEDIUM"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.status === "RESOLVED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.status === "IN_PROGRESS"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : item.status === "VERIFIED"
                              ? "bg-sky-50 text-sky-700 border border-sky-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {item.status === "IN_PROGRESS"
                            ? "Dikerjakan"
                            : item.status === "OPEN" || item.status === "SUBMITTED"
                            ? "Menunggu"
                            : item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {(item.status === "OPEN" || item.status === "SUBMITTED") && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleVerifyTicket(item.id)}
                              disabled={isSubmitting}
                            >
                              Verifikasi
                            </Button>
                          )}

                          {item.status === "OPEN" || item.status === "SUBMITTED" || item.status === "VERIFIED" ? (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<Wrench className="w-3 h-3" />}
                              onClick={() => handleOpenSpkModal(item)}
                              disabled={isSubmitting}
                            >
                              Terbitkan SPK
                            </Button>
                          ) : item.status === "IN_PROGRESS" ? (
                            <Button
                              variant="gold"
                              size="sm"
                              icon={<CheckCircle2 className="w-3 h-3 text-emerald-800" />}
                              onClick={() => handleResolveTicket(item)}
                              disabled={isSubmitting}
                            >
                              Selesaikan
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Selesai</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-xs text-slate-400">
                        Tidak ada pengaduan yang sesuai kriteria filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Terbitkan SPK */}
      {showSpkModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-brand-maroon-700" />
                Terbitkan SPK Teknisi Resmi
              </h3>
              <button onClick={() => setShowSpkModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Penugasan teknisi lapangan untuk tiket <strong className="text-slate-800">{selectedTicket.ticketNumber}</strong> ({selectedTicket.customerName} - {selectedTicket.dusunName}).
            </p>

            <form onSubmit={handleCreateSpk} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tugaskan Teknisi Lapangan
                </label>
                <select
                  value={selectedTechnicianId}
                  onChange={(e) => setSelectedTechnicianId(parseInt(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white font-medium"
                >
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (@{t.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Instruksi Khusus / Catatan Lapangan
                </label>
                <textarea
                  value={spkNotes}
                  onChange={(e) => setSpkNotes(e.target.value)}
                  rows={3}
                  required
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowSpkModal(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="font-bold"
                  icon={isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Menerbitkan..." : "Terbitkan SPK"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
