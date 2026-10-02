"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
  status: "SUBMITTED" | "VERIFIED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  createdAt: string;
  technicianName?: string;
  spkNumber?: string;
}

const INITIAL_COMPLAINTS: ComplaintItem[] = [
  {
    id: 1,
    ticketNumber: "TKT/20261001/A88",
    kpspamsId: 1,
    kpspamsName: "KPSPAMS Lemo Baru",
    customerName: "H. Abdullah Rahman",
    customerCode: "CUST-LB-001",
    dusunName: "Dusun Lemo Baru",
    phone: "081234567801",
    category: "PIPA_BOCOR",
    description: "Pipa distribusi depan rumah patah terkena roda traktor warga, air meluap ke badan jalan.",
    priority: "HIGH",
    status: "IN_PROGRESS",
    createdAt: "2026-10-01 08:30",
    technicianName: "Kaharuddin (Teknisi Jaringan)",
    spkNumber: "SPK/20261001/01A",
  },
  {
    id: 2,
    ticketNumber: "TKT/20261001/B12",
    kpspamsId: 2,
    kpspamsName: "KPSPAMS Lemo Tua",
    customerName: "Kaharuddin Tahir",
    customerCode: "CUST-LT-003",
    dusunName: "Dusun Lemo Tua",
    phone: "081234567808",
    category: "AIR_KERUH",
    description: "Air kran berwarna kecokelatan setelah hujan lebat malam kemarin.",
    priority: "MEDIUM",
    status: "VERIFIED",
    createdAt: "2026-10-01 09:15",
  },
  {
    id: 3,
    ticketNumber: "TKT/20260930/C44",
    kpspamsId: 3,
    kpspamsName: "KPSPAMS Sarampu 1",
    customerName: "Drs. Muh. Yusuf",
    customerCode: "CUST-SR-005",
    dusunName: "Dusun Pakkandoang",
    phone: "081234567812",
    category: "METER_RUSAK",
    description: "Kaca meteran buram dan jarum angka macet tidak bergerak meskipun kran air mengalir kencang.",
    priority: "MEDIUM",
    status: "SUBMITTED",
    createdAt: "2026-09-30 16:40",
  },
  {
    id: 4,
    ticketNumber: "TKT/20260929/D09",
    kpspamsId: 1,
    kpspamsName: "KPSPAMS Lemo Baru",
    customerName: "Sitti Maryam",
    customerCode: "CUST-LB-002",
    dusunName: "Dusun Lemo Baru",
    phone: "081234567802",
    category: "TEKANAN_RENDAH",
    description: "Aliran air sangat kecil sejak 2 hari lalu pada siang hari.",
    priority: "LOW",
    status: "RESOLVED",
    createdAt: "2026-09-29 11:20",
    technicianName: "Kaharuddin (Teknisi Jaringan)",
    spkNumber: "SPK/20260929/04B",
  },
];

export default function PengaduanPage() {
  return (
    <DashboardLayout>
      <PengaduanContent />
    </DashboardLayout>
  );
}

function PengaduanContent() {
  const { activeKpspamsId } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintItem[]>(INITIAL_COMPLAINTS);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [selectedTicket, setSelectedTicket] = useState<ComplaintItem | null>(null);
  const [showSpkModal, setShowSpkModal] = useState<boolean>(false);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("Kaharuddin (Teknisi Jaringan)");
  const [spkNotes, setSpkNotes] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filtered = complaints.filter((c) => {
    if (activeKpspamsId !== null && c.kpspamsId !== activeKpspamsId) {
      return false;
    }
    if (statusFilter !== "ALL" && c.status !== statusFilter) {
      return false;
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
    setSpkNotes(`Perbaikan penanganan keluhan kategori ${ticket.category} di ${ticket.dusunName}.`);
    setShowSpkModal(true);
  };

  const handleCreateSpk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const newSpkNo = "SPK/" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "/" + Math.floor(100 + Math.random() * 900);

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === selectedTicket.id) {
          return {
            ...c,
            status: "IN_PROGRESS",
            technicianName: selectedTechnician,
            spkNumber: newSpkNo,
          };
        }
        return c;
      })
    );

    setShowSpkModal(false);
    setSuccessMsg(`SPK nomor ${newSpkNo} berhasil diterbitkan untuk teknisi ${selectedTechnician}.`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleResolveTicket = (ticketId: number) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === ticketId) {
          return { ...c, status: "RESOLVED" };
        }
        return c;
      })
    );
    setSuccessMsg("Tiket pengaduan berhasil diselesaikan.");
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-maroon-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-brand-maroon-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-brand-gold-500/20 text-brand-gold-400 text-[11px] font-bold mb-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Respons Cepat Gangguan Air Bersih</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Pengaduan Layanan & SPK Teknisi
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Penerimaan tiket keluhan, penerbitan Surat Perintah Kerja (SPK), dan pemantauan perbaikan pipa perdesaan.
          </p>
        </div>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{successMsg}</span>
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
          <div className="text-[10px] sm:text-xs text-amber-700 font-bold uppercase tracking-wider">Menunggu Review</div>
          <div className="mt-1 text-2xl font-black text-amber-800 font-tabular">
            {filtered.filter((c) => c.status === "SUBMITTED").length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Perlu ditinjau pengurus</div>
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
              <option value="SUBMITTED">Menunggu Verifikasi</option>
              <option value="VERIFIED">Terverifikasi</option>
              <option value="IN_PROGRESS">SPK Diterbitkan</option>
              <option value="RESOLVED">Selesai</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Mobile Card View (< md) */}
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
                  <span>{item.spkNumber} ({item.technicianName})</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex items-center justify-end space-x-2">
              {item.status === "SUBMITTED" || item.status === "VERIFIED" ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full font-bold"
                  icon={<Wrench className="w-3.5 h-3.5" />}
                  onClick={() => handleOpenSpkModal(item)}
                >
                  Terbitkan SPK Teknisi
                </Button>
              ) : item.status === "IN_PROGRESS" ? (
                <Button
                  variant="gold"
                  size="sm"
                  className="w-full font-bold"
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  onClick={() => handleResolveTicket(item.id)}
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
      </div>

      {/* Desktop Table View (>= md) */}
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
                          {item.spkNumber} ({item.technicianName})
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
                        {item.status === "IN_PROGRESS" ? "Dikerjakan" : item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.status === "SUBMITTED" || item.status === "VERIFIED" ? (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<Wrench className="w-3 h-3" />}
                            onClick={() => handleOpenSpkModal(item)}
                          >
                            Terbitkan SPK
                          </Button>
                        ) : item.status === "IN_PROGRESS" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            onClick={() => handleResolveTicket(item.id)}
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
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modal Terbitkan SPK */}
      {showSpkModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-brand-maroon-700" />
                Terbitkan SPK Teknisi
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
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white font-medium"
                >
                  <option value="Kaharuddin (Teknisi Jaringan)">Kaharuddin (Teknisi Jaringan)</option>
                  <option value="Baharuddin (Teknisi Meter Air)">Baharuddin (Teknisi Meter Air)</option>
                  <option value="Rustam (Operator Pompa Intake)">Rustam (Operator Pompa Intake)</option>
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
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="font-bold"
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Terbitkan SPK
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
