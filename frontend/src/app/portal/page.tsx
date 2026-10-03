"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Droplet,
  AlertCircle,
  FileText,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Send,
  MapPin,
  ShieldCheck,
  Phone,
  Sparkles,
  X,
  Search,
  HelpCircle,
  RotateCcw,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DEMO_CUSTOMERS, DemoCustomer } from "@/lib/demo-data";

function CitizenPortalContent() {
  const searchParams = useSearchParams();
  const [searchSr, setSearchSr] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<DemoCustomer | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Complaint modal states
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState("AIR_MATI");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [ticketGenerated, setTicketGenerated] = useState<string | null>(null);

  // Auto-search if ?sr= parameter is provided in URL
  useEffect(() => {
    const srQuery = searchParams.get("sr");
    if (srQuery) {
      findAndSetCustomer(srQuery);
    }
  }, [searchParams]);

  const findAndSetCustomer = (query: string) => {
    const cleanQuery = query.trim().toUpperCase();
    if (!cleanQuery) {
      setErrorMessage("Silakan masukkan Nomor Sambungan Rumah (No. SR).");
      return;
    }

    // Try finding exact match or partial match on connectionNo or name
    const found = DEMO_CUSTOMERS.find((c) => {
      const connUpper = c.connectionNo.toUpperCase();
      const nameUpper = c.name.toUpperCase();
      return (
        connUpper === cleanQuery ||
        connUpper.endsWith(cleanQuery) ||
        connUpper.replace(/-/g, "").includes(cleanQuery.replace(/-/g, "")) ||
        nameUpper.includes(cleanQuery)
      );
    });

    if (found) {
      setSelectedCustomer(found);
      setErrorMessage(null);
      setSearchSr(found.connectionNo);
    } else {
      setErrorMessage(
        `Nomor SR "${query}" tidak ditemukan dalam basis data pelanggan. Silakan periksa kembali atau pilih contoh nomor sambungan di bawah.`
      );
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    findAndSetCustomer(searchSr);
  };

  const handleQuickSelect = (srNumber: string) => {
    setSearchSr(srNumber);
    findAndSetCustomer(srNumber);
  };

  const handleResetSearch = () => {
    setSelectedCustomer(null);
    setSearchSr("");
    setErrorMessage(null);
  };

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tck = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketGenerated(tck);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-brand-maroon-800 selection:text-white">
      {/* Citizen Header Bar */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-brand-gold-500/50 shadow bg-slate-950 flex items-center justify-center p-0.5">
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
              <p className="text-[11px] text-slate-400">
                {selectedCustomer
                  ? `${selectedCustomer.kpspamsName} • Dusun ${selectedCustomer.dusun}`
                  : "Pelayanan Publik Air Minum & Sanitasi Perdesaan"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/"
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
            >
              Beranda
            </Link>
            <Link
              href="/login"
              className="text-xs text-brand-gold-300 hover:text-brand-gold-200 px-3 py-1.5 rounded-xl bg-brand-gold-950/40 hover:bg-brand-gold-950/70 border border-brand-gold-500/30 transition font-medium"
            >
              Login Petugas
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 sm:py-8 w-full space-y-6">
        {!selectedCustomer ? (
          /* ========================================================================= */
          /* STATE 1: SEARCH SCREEN (Masukkan Nomor SR Terlebih Dahulu)                 */
          /* ========================================================================= */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Hero Banner */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl shadow-slate-200/50 relative overflow-hidden">
              <div className="w-full h-1.5 bg-gradient-to-r from-brand-maroon-800 via-brand-maroon-600 to-brand-gold-500 rounded-t-3xl absolute top-0 left-0 right-0" />

              <div className="max-w-2xl mx-auto text-center pt-2">
                <div className="w-16 h-16 rounded-2xl bg-brand-maroon-50 text-brand-maroon-800 border border-brand-maroon-200/80 mx-auto flex items-center justify-center mb-4 shadow-xs">
                  <Droplet className="w-8 h-8 text-brand-maroon-800" />
                </div>

                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-gold-50 text-brand-gold-900 border border-brand-gold-300 mb-3">
                  <span>Layanan Mandiri Warga Desa Kuajang</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Cek Rekening & Tagihan Air Bersih
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  Silakan masukkan <strong>Nomor Sambungan Rumah (No. SR)</strong> Anda untuk melihat nominal tagihan aktif, rincian pemakaian kubikasi, riwayat pembayaran, atau mengajukan pengaduan.
                </p>

                {/* Form Input No SR */}
                <form onSubmit={handleSearchSubmit} className="mt-8 max-w-md mx-auto">
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Search className="w-5 h-5 text-brand-maroon-800" />
                      </div>
                      <input
                        type="text"
                        required
                        value={searchSr}
                        onChange={(e) => {
                          setSearchSr(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="Masukkan No. SR (Contoh: SR-LMB-00001)"
                        className="w-full pl-12 pr-4 py-3.5 text-sm sm:text-base font-semibold bg-slate-50 hover:bg-white focus:bg-white border-2 border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-800 focus:border-brand-maroon-800 text-slate-900 transition font-mono tracking-wider shadow-inner"
                      />
                    </div>

                    {errorMessage && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-left flex items-start space-x-2 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold text-white bg-brand-maroon-800 hover:bg-brand-maroon-900 active:scale-[0.99] transition shadow-lg shadow-brand-maroon-950/20 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Search className="w-4 h-4 text-brand-gold-400" />
                      <span>Periksa Rekening Air Saya</span>
                    </button>
                  </div>
                </form>

                {/* Quick Selection Helper for Evaluation / Citizens */}
                <div className="mt-8 pt-6 border-t border-slate-100 text-left">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 mb-3">
                    <Sparkles className="w-4 h-4 text-brand-gold-600" />
                    <span>Contoh Nomor SR Sambungan Terdaftar (Klik untuk uji coba):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      {
                        sr: "SR-LMB-00001",
                        name: "Muhammad Yusuf",
                        dusun: "Lemo Baru",
                        unit: "KPSPAMS Lemo Baru",
                      },
                      {
                        sr: "SR-LMB-00002",
                        name: "Baharuddin S.",
                        dusun: "Lemo Baru",
                        unit: "KPSPAMS Lemo Baru",
                      },
                      {
                        sr: "SR-LMB-00003",
                        name: "H. Kamaruddin Basri",
                        dusun: "Lemo Baru",
                        unit: "KPSPAMS Lemo Baru",
                      },
                      {
                        sr: "SR-LMT-00001",
                        name: "Siti Aminah",
                        dusun: "Lemo Tua",
                        unit: "KPSPAMS Lemo Tua",
                      },
                    ].map((item) => (
                      <button
                        key={item.sr}
                        type="button"
                        onClick={() => handleQuickSelect(item.sr)}
                        className="p-3 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-brand-maroon-700/50 hover:shadow-xs transition flex items-center justify-between group"
                      >
                        <div>
                          <span className="font-mono font-bold text-xs text-brand-maroon-900 group-hover:text-brand-maroon-700 block">
                            {item.sr}
                          </span>
                          <span className="text-[11px] text-slate-600 font-medium block">
                            {item.name} • Dusun {item.dusun}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500 group-hover:bg-brand-maroon-50 group-hover:text-brand-maroon-800">
                          Pilih
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Informational Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-700 text-xs">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                  1
                </div>
                <h4 className="font-bold text-slate-900">Di Mana Melihat No. SR?</h4>
                <p className="text-slate-500 leading-relaxed">
                  Nomor SR tertera pada pelat barcode meteran air di rumah Anda atau struk kertas pembayaran bulan lalu.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  2
                </div>
                <h4 className="font-bold text-slate-900">Pembayaran Iuran Air</h4>
                <p className="text-slate-500 leading-relaxed">
                  Iuran dapat dibayarkan langsung saat petugas keliling berkunjung (door-to-door) atau di Kantor KPSPAMS.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  3
                </div>
                <h4 className="font-bold text-slate-900">Bantuan & Aduan Warga</h4>
                <p className="text-slate-500 leading-relaxed">
                  Jika mengalami air mati, pipa bocor, atau meteran rusak, ajukan pengaduan langsung melalui portal ini.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STATE 2: CUSTOMER DASHBOARD (Menampilkan Data Pelanggan yang Dicari)       */
          /* ========================================================================= */
          <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
            {/* Top Back Action Bar */}
            <div className="flex items-center justify-between bg-white rounded-2xl p-3 sm:px-5 border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={handleResetSearch}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-brand-maroon-900 transition px-3 py-1.5 rounded-xl hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4 text-brand-maroon-800" />
                <span>Cari Nomor SR Lain</span>
              </button>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 font-medium block">
                  Nomor Sambungan Rumah:
                </span>
                <span className="font-mono text-xs font-bold text-brand-maroon-900">
                  {selectedCustomer.connectionNo}
                </span>
              </div>
            </div>

            {/* Customer Profile Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Akun Sambungan Terdaftar
                  </span>
                  <Badge variant="success" size="sm">Sambungan Aktif</Badge>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {selectedCustomer.tariffType || "Rumah Tangga"}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {selectedCustomer.name}
                </h2>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                  <span>
                    No. SR: <strong className="font-mono text-brand-maroon-900 font-bold">{selectedCustomer.connectionNo}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dusun {selectedCustomer.dusun}</span>
                  </span>
                  <span>•</span>
                  <span>
                    Seri Meter: <strong className="font-mono text-slate-700">{selectedCustomer.meterSerial}</strong>
                  </span>
                  <span>•</span>
                  <span className="text-slate-600 font-medium">{selectedCustomer.kpspamsName}</span>
                </div>
              </div>
            </div>

            {/* Hero Active Bill Card */}
            <div className="bg-gradient-to-br from-brand-maroon-900 via-brand-maroon-800 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-brand-maroon-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-gold-500/20 text-brand-gold-400 text-xs font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>TAGIHAN PERIODE OKTOBER 2026</span>
                  </div>
                  <div className="text-3xl sm:text-5xl font-black font-tabular tracking-tight">
                    {selectedCustomer.billingStatus === "PAID" ? "Rp 0,-" : "Rp 10.000,-"}
                  </div>
                  <p className="text-xs text-amber-100/90 mt-2">
                    {selectedCustomer.billingStatus === "PAID" ? (
                      <span className="font-bold text-emerald-300">
                        Tagihan periode ini telah LUNAS. Terima kasih atas partisipasi Anda!
                      </span>
                    ) : (
                      <>
                        Jatuh tempo: <strong>20 Oktober 2026</strong> • Pemakaian air: <strong>14.50 m³</strong> (Paket Dasar s.d 15 m³)
                      </>
                    )}
                  </p>
                  <div className="mt-2 text-[11px] text-amber-200/90 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold-400 flex-shrink-0" />
                    <span>Pembayaran tunai diterima saat Petugas berkunjung keliling (Door-to-Door) atau di Kantor KPSPAMS.</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <a
                    href={`https://wa.me/6282100000004?text=Halo%20Petugas%20KPSPAMS%20Kuajang,%20saya%20warga%20${encodeURIComponent(
                      selectedCustomer.name
                    )}%20(No.%20SR:%20${selectedCustomer.connectionNo})%20ingin%20konfirmasi%20pembayaran%20iuran%20air`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-sm shadow-xl transition active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Hubungi Petugas (WA)</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => alert(`Mengunduh rincian bukti tagihan resmi untuk No. SR ${selectedCustomer.connectionNo}...`)}
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
              <p className="text-xs text-slate-500 mb-6">Grafik konsumsi kubikasi air di sambungan rumah {selectedCustomer.name}</p>

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
                    Laporkan pipa bocor, air keruh, meter mati, atau tekanan rendah langsung ke tim teknisi {selectedCustomer.kpspamsName}.
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
          </div>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="max-w-4xl w-full mx-auto px-4 text-center py-6 text-xs text-slate-400 border-t border-slate-200 mt-8">
        <p>© 2026 Pemerintah Desa Kuajang, Kec. Binuang, Kab. Polewali Mandar.</p>
        <p className="text-[11px] text-slate-400/80 mt-0.5">
          SI-KPSPAMS KUAJANG • Layanan Transparansi Air Bersih Warga
        </p>
      </footer>

      {/* Complaint Modal */}
      {complaintModalOpen && selectedCustomer && (
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
                  Laporan untuk No. SR <strong>{selectedCustomer.connectionNo}</strong> ({selectedCustomer.name}) telah diteruskan ke Pengelola {selectedCustomer.kpspamsName} untuk penugasan Surat Perintah Kerja (SPK) teknisi lapangan.
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
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">Formulir Pengaduan Warga</h4>
                    <p className="text-[11px] text-slate-400">
                      No. SR: {selectedCustomer.connectionNo} ({selectedCustomer.name})
                    </p>
                  </div>
                  <button type="button" onClick={() => setComplaintModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
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
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-maroon-700"
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

export default function CitizenPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-brand-maroon-800 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Memuat Portal Mandiri Warga...</p>
          </div>
        </div>
      }
    >
      <CitizenPortalContent />
    </Suspense>
  );
}
