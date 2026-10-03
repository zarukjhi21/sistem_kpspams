"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Droplet,
  AlertCircle,
  FileText,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Send,
  Camera,
  MapPin,
  Check,
  ShieldCheck,
  Phone,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function CitizenPortalPage() {
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState("AIR_MATI");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [ticketGenerated, setTicketGenerated] = useState<string | null>(null);

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tck = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketGenerated(tck);
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col selection:bg-brand-maroon-800 selection:text-white">
      {/* Citizen Header Bar */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-brand-gold-500/50 shadow bg-slate-950 flex items-center justify-center">
              <Image
                src="/logo.jpg"
                alt="Logo SI-KPSPAMS Kuajang"
                width={36}
                height={36}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-extrabold tracking-tight">PORTAL MANDIRI WARGA</span>
                <span className="text-[10px] text-brand-gold-400 font-extrabold px-1.5 py-0.5 rounded bg-brand-gold-950/80 border border-brand-gold-500/40">
                  DESA KUAJANG
                </span>
              </div>
              <p className="text-[11px] text-slate-400">KPSPAMS Lemo Baru • Dusun Lemo Baru</p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="text-xs text-amber-300 hover:text-white flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kembali ke Admin</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 sm:py-8 w-full space-y-5 sm:space-y-6">
        {/* Customer Profile Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Akun Sambungan Terdaftar
              </span>
              <Badge variant="success" size="sm">Sambungan Aktif</Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Muhammad Yusuf
            </h2>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span>
                No. SR: <strong className="font-mono text-brand-maroon-900 font-bold">SR-LMB-00001</strong>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Dusun Lemo Baru RT 01</span>
              </span>
              <span>•</span>
              <span>Seri Meter: <strong className="font-mono text-slate-700">MTR-LMB-001</strong></span>
            </div>
          </div>
        </div>

        {/* Hero Active Bill Card */}
        <div className="bg-gradient-to-br from-brand-maroon-900 via-brand-maroon-800 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-brand-maroon-700 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-gold-500/20 text-brand-gold-400 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>TAGIHAN PERIODE OKTOBER 2026</span>
              </div>
              <div className="text-3xl sm:text-5xl font-black font-tabular tracking-tight">
                Rp 10.000,-
              </div>
              <p className="text-xs text-amber-100/90 mt-2">
                Jatuh tempo: <strong>20 Oktober 2026</strong> • Pemakaian air: <strong>14.50 m³</strong> (Paket Dasar s.d 15 m³)
              </p>
              <div className="mt-2 text-[11px] text-amber-200/90 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold-400 flex-shrink-0" />
                <span>Pembayaran tunai diterima saat Petugas berkunjung keliling (Door-to-Door) atau di Kantor KPSPAMS.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <a
                href="https://wa.me/6282100000004?text=Halo%20Petugas%20KPSPAMS%20Kuajang,%20saya%20warga%20ingin%20konfirmasi%20pembayaran%20iuran%20air"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-sm shadow-xl transition active:scale-95 flex items-center justify-center space-x-2"
              >
                <Phone className="w-4 h-4" />
                <span>Hubungi Petugas (WA)</span>
              </a>

              <button
                type="button"
                onClick={() => alert("Mengunduh rincian tagihan invoice PDF...")}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition active:scale-95 flex items-center justify-center space-x-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Download Rincian PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6-Month Water Consumption History Chart */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Riwayat Pemakaian Air Bersih (6 Bulan Terakhir)
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Satuan m³</span>
          </div>
          <p className="text-xs text-slate-500 mb-6">Grafik konsumsi kubikasi air di sambungan rumah Anda</p>

          <div className="grid grid-cols-6 gap-2 pt-8 pb-3 items-end h-44 border-b border-slate-100 text-center">
            {[
              { month: "Mei", m3: 12.0, h: "h-24" },
              { month: "Jun", m3: 15.0, h: "h-32" },
              { month: "Jul", m3: 11.5, h: "h-20" },
              { month: "Ags", m3: 13.0, h: "h-28" },
              { month: "Sep", m3: 16.0, h: "h-36" },
              { month: "Okt", m3: 14.5, h: "h-30", active: true },
            ].map((bar, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[11px] font-black text-slate-800 font-tabular mb-1.5">
                  {bar.m3}m³
                </span>
                <div
                  className={`w-8 sm:w-14 rounded-t-xl transition-all ${bar.h} ${
                    bar.active
                      ? "bg-gradient-to-t from-brand-maroon-900 to-brand-maroon-700 shadow-md shadow-brand-maroon-900/30"
                      : "bg-slate-200 hover:bg-slate-300"
                  }`}
                />
                <span
                  className={`text-[11px] mt-2 font-semibold ${
                    bar.active ? "text-brand-maroon-900 font-bold" : "text-slate-500"
                  }`}
                >
                  {bar.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Report Problem / Complaint Section */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Mengalami Gangguan Air Bersih?</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Laporkan pipa bocor, air keruh, meter mati, atau tekanan rendah langsung ke tim teknisi KPSPAMS.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            className="w-full sm:w-auto font-bold"
            onClick={() => {
              setTicketGenerated(null);
              setComplaintModalOpen(true);
            }}
          >
            Ajukan Pengaduan
          </Button>
        </div>
      </main>


      {/* Complaint Modal */}
      {complaintModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            {ticketGenerated ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-slate-900">Laporan Pengaduan Terkirim!</h4>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 inline-block font-mono font-bold text-brand-maroon-900 text-sm">
                  Nomor Tiket: {ticketGenerated}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Laporan Anda diteruskan ke Pengelola KPSPAMS Lemo Baru untuk penugasan Surat Perintah Kerja (SPK) teknisi lapangan.
                </p>
                <div className="pt-2">
                  <Button variant="primary" size="md" className="w-full font-bold" onClick={() => setComplaintModalOpen(false)}>
                    Selesai
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleComplaintSubmit} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-base font-extrabold text-slate-900">Formulir Pengaduan Warga</h4>
                  <button type="button" onClick={() => setComplaintModalOpen(false)} className="text-slate-400 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Kategori Masalah:
                  </label>
                  <select
                    value={complaintCategory}
                    onChange={(e) => setComplaintCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="AIR_MATI">Air Tidak Mengalir Sama Sekali</option>
                    <option value="TEKANAN_RENDAH">Tekanan Air Sangat Lemah</option>
                    <option value="PIPA_BOCOR">Pipa Distribusi / Sambungan Bocor</option>
                    <option value="METER_RUSAK">Meter Air Mati / Angka Buram</option>
                    <option value="KUALITAS_AIR">Air Keruh / Berbau</option>
                    <option value="TAGIHAN">Koreksi Tagihan Tidak Wajar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Deskripsi Detail Gangguan:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                    placeholder="Jelaskan kondisi gangguan dan patokan rumah Anda..."
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setComplaintModalOpen(false)}>
                    Batal
                  </Button>
                  <Button variant="primary" size="sm" type="submit" className="font-bold" icon={<Send className="w-3.5 h-3.5" />}>
                    Kirim Pengaduan
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
