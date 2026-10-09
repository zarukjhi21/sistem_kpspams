"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import {
  ShieldCheck,
  Activity,
  Users,
  FileText,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle,
  CheckCircle2,
  Receipt,
  Wallet,
  Search,
  Droplets,
  Mountain,
  PhoneCall,
  HelpCircle,
  Lock,
  ArrowDown,
  Layers,
  MapPin,
  TrendingUp,
  Gauge,
} from "lucide-react";
import dynamic from "next/dynamic";

const PublicTransparencyCharts = dynamic(
  () => import("@/components/charts/PublicTransparencyCharts").then((m) => m.PublicTransparencyCharts),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 w-full animate-pulse bg-slate-800/40 rounded-2xl flex items-center justify-center border border-slate-700/50">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <div className="w-6 h-6 border-2 border-brand-gold-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Memuat visualisasi keuangan transparansi...</span>
        </div>
      </div>
    ),
  }
);

const PublicGisMapSection = dynamic(
  () => import("@/components/gis/PublicGisMapSection").then((m) => m.PublicGisMapSection),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 w-full animate-pulse bg-slate-800/40 rounded-2xl flex items-center justify-center border border-slate-700/50">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <div className="w-6 h-6 border-2 border-brand-gold-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Memuat peta satelit GIS sambungan air...</span>
        </div>
      </div>
    ),
  }
);

export default function HomePage() {
  const router = useRouter();
  const [quickSearch, setQuickSearch] = useState("");
  const [stats, setStats] = useState({
    lmbCash: 30216000,
    lmbCustomers: 45,
    lmbUsageM3: 0,
    lmbPhysicalMeterM3: 62157.5,
    totalCash: 30216000,
    totalCustomers: 45,
    totalUsageM3: 0,
    totalPhysicalMeterM3: 62157.5,
  });

  useEffect(() => {
    apiClient<{
      units: Record<string, {
        cash: number;
        customers: number;
        usage_m3?: number;
        physical_meter_m3?: number;
      }>;
      total_cash: number;
      total_customers: number;
      total_usage_m3?: number;
      total_physical_meter_m3?: number;
    }>("/portal/transparency")
      .then((res) => {
        if (res?.data?.units) {
          const lmbCash = res.data.units.LMB?.cash ?? 30216000;
          const lmbCust = res.data.units.LMB?.customers ?? 45;
          const lmbUsage = Number(res.data.units.LMB?.usage_m3 ?? 0);
          const lmbPhysical = Number(res.data.units.LMB?.physical_meter_m3 ?? 62157.5);
          const totCash = Number(res.data.total_cash ?? lmbCash);
          const totCust = Number(res.data.total_customers ?? lmbCust);
          const totUsage = Number(res.data.total_usage_m3 ?? lmbUsage);
          const totPhysical = Number(res.data.total_physical_meter_m3 ?? lmbPhysical);
          setStats({
            lmbCash,
            lmbCustomers: lmbCust,
            lmbUsageM3: lmbUsage,
            lmbPhysicalMeterM3: lmbPhysical,
            totalCash: totCash,
            totalCustomers: totCust,
            totalUsageM3: totUsage,
            totalPhysicalMeterM3: totPhysical,
          });
        }
      })
      .catch((err) => {
        console.warn("HomePage: could not fetch live transparency stats", err);
      });
  }, []);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearch.trim()) return;
    router.push(`/portal?no=${encodeURIComponent(quickSearch.trim())}`);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-brand-maroon-800 selection:text-white">
      {/* Header Bar */}
      <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-brand-gold-500/50 shadow-lg bg-slate-950 flex-shrink-0 flex items-center justify-center p-0.5">
              <Image
                src="/logo.jpg"
                alt="Logo SI-KPSPAMS Kuajang"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-white whitespace-nowrap">
                  SI-KPSPAMS
                </span>
                <span className="hidden sm:inline-block text-[9px] sm:text-[10px] text-brand-gold-400 font-extrabold px-1.5 py-0.5 rounded bg-brand-gold-950/80 border border-brand-gold-500/40 whitespace-nowrap">
                  KUAJANG
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate hidden sm:block">Desa Kuajang, Kec. Binuang, Polman</p>
            </div>
          </Link>

          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            <Link
              href="/portal"
              className="inline-flex px-2 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-amber-300 hover:text-white transition rounded-lg hover:bg-slate-800/60 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Portal Warga</span>
              <span className="sm:hidden">Portal</span>
            </Link>
            <Link
              href="/login"
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-brand-gold-500 to-amber-500 hover:from-brand-gold-600 hover:to-amber-600 text-brand-maroon-950 text-[11px] sm:text-sm font-extrabold rounded-xl shadow-md transition active:scale-95 flex items-center space-x-1 sm:space-x-1.5 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Masuk Petugas</span>
              <span className="sm:hidden">Masuk</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10 w-full space-y-8 sm:space-y-12">
        {/* Modern Dual-Column Hero Section */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-brand-maroon-950/70 to-slate-950 border border-slate-800/90 p-6 sm:p-10 lg:p-12 shadow-2xl">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-maroon-600/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Headline, Description & Cek Tagihan Kilat */}
            <div className="lg:col-span-7 space-y-5">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-snug sm:leading-tight">
                Pengelolaan Transparan &amp; Akuntabel Air Bersih Perdesaan
              </h1>

              <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-xl">
                Sistem informasi pelayanan air bersih, pencatatan meter digital, dan transparansi kas warga Desa Kuajang.
              </p>

              {/* Bar Pencarian Cek Tagihan Minimalis */}
              <form onSubmit={handleQuickSearch} className="flex flex-col sm:flex-row gap-2 max-w-lg pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    placeholder="Cari nama warga atau No. Sambungan..."
                    className="w-full pl-9 pr-3 py-3 rounded-2xl bg-slate-950/90 border border-slate-700 text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-lg transition"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition active:scale-95 flex items-center justify-center space-x-1.5 whitespace-nowrap"
                >
                  <span>Cek Tagihan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-maroon-800 to-brand-maroon-900 hover:from-brand-maroon-900 hover:to-black text-white text-xs sm:text-sm font-bold shadow-lg shadow-brand-maroon-950/40 border border-brand-maroon-700 text-center transition active:scale-95 flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4 text-brand-gold-400" />
                  <span>Akses Pengelola KPSPAMS</span>
                </Link>

                <Link
                  href="/portal"
                  className="text-xs sm:text-sm font-semibold text-slate-400 hover:text-white px-3 py-2 transition flex items-center space-x-1.5"
                >
                  <span>Portal Warga Mandiri</span>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </Link>
              </div>
            </div>

            {/* Right Column: Glassmorphism Live Stats Widget */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-slate-950/75 backdrop-blur-xl border border-slate-700/80 p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Status Operasional Riil
                    </span>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-emerald-400 text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1" />
                    <span>Live Database</span>
                  </span>
                </div>

                {/* Metric Panels: Clean & Direct */}
                <div className="space-y-2.5">
                  {/* Metric 1: Kas Operasional */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-medium text-slate-400">Total Kas Operasional Riil</div>
                      <div className="text-2xl font-black text-amber-400 mt-0.5">
                        Rp {stats.lmbCash.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/80">
                      100% Kas Utuh
                    </span>
                  </div>

                  {/* Metric 2: Sambungan Rumah */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-medium text-slate-400">Sambungan Rumah (SR) Terlayani</div>
                      <div className="text-2xl font-black text-white mt-0.5">
                        {stats.lmbCustomers} SR Aktif
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                      Lemo Baru
                    </span>
                  </div>

                  {/* Metric 3 & 4 Grid: Pemakaian Air Bulan Ini & Stand Fisik Odometer */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Pakai Bulan Ini
                        </span>
                        <div className="p-1 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                          <Activity className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-lg sm:text-xl font-black text-white font-tabular">
                          {stats.lmbUsageM3.toLocaleString("id-ID")}
                          <span className="text-[10px] font-normal text-slate-400 ml-0.5">m³</span>
                        </span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
                          Bulan Ini
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Stand Fisik
                        </span>
                        <div className="p-1 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/60">
                          <Gauge className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-lg sm:text-xl font-black text-indigo-300 font-tabular truncate">
                          {stats.lmbPhysicalMeterM3.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                          <span className="text-[10px] font-normal text-slate-400 ml-0.5">m³</span>
                        </span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                          Odometer
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metric 5: Gravitasi Mata Air */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-medium text-slate-400">Debit Aliran Alami Lemo Baru</div>
                      <div className="text-2xl font-black text-cyan-400 mt-0.5">
                        ~12.100 L / Hari
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                      0 Listrik PLN
                    </span>
                  </div>
                </div>

                {/* Progress Health Bar */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Kelancaran Distribusi Jaringan:</span>
                    <span className="font-bold text-emerald-400">99.4% Normal</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[99.4%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Real-time Meter & Usage Showcase (Sesuai Dashboard Penagihan Lapangan) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
                Pemantauan Konsumsi &amp; Stand Fisik Meteran Riil
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1" />
              <span>Real-Time Database</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Card 1: Pemakaian Air Bulan Ini */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-3 hover:border-cyan-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-wider">
                  Pemakaian Air Bulan Ini
                </span>
                <div className="p-2.5 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl sm:text-4xl font-black text-white font-tabular tracking-tight">
                  {stats.lmbUsageM3.toLocaleString("id-ID")}
                  <span className="text-base sm:text-lg font-normal text-slate-400 ml-1.5">m³</span>
                </span>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  BULAN BERJALAN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {stats.lmbUsageM3 === 0
                  ? "Masa transisi stand awal • Beban dasar Rp 10.000/SR"
                  : `Rata-rata ${(stats.lmbCustomers > 0 ? (stats.lmbUsageM3 / stats.lmbCustomers).toFixed(1) : 0)} m³/SR`}
              </p>
            </div>

            {/* Card 2: Total Stand Fisik Meteran (Odometer SR) */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-3 hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-wider">
                  Total Stand Fisik Meteran
                </span>
                <div className="p-2.5 rounded-2xl bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                  <Gauge className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl sm:text-4xl font-black text-indigo-300 font-tabular tracking-tight">
                  {stats.lmbPhysicalMeterM3.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                  <span className="text-base sm:text-lg font-normal text-slate-400 ml-1.5">m³</span>
                </span>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  ODOMETER SR
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Total akumulasi putaran meter fisik {stats.lmbCustomers} SR di lapangan
              </p>
            </div>
          </div>
        </section>

        {/* 3 Unit KPSPAMS Grid */}
        <section id="unit-pengelola" className="space-y-4">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              3 Unit Pengelola KPSPAMS Desa Kuajang
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Pembagian wilayah pelayanan air bersih mandiri berdasarkan sumber air per unit desa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Unit 1: LMB (Operasional Aktif Penuh) */}
            <div className="p-5 rounded-3xl border-2 border-emerald-500/50 bg-gradient-to-b from-emerald-950/30 to-slate-900/60 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-900 text-emerald-200 border border-emerald-600 shadow-sm">
                    Unit 1 (LMB)
                  </span>
                  <span className="text-xs text-emerald-400 font-extrabold flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Aktif Beroperasi</span>
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-black text-white">
                    KPSPAMS Lemo Baru
                  </h4>
                  <p className="text-xs text-emerald-400 font-medium mt-1">
                    Wilayah Layanan: Dusun Lemo Baru
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mata Air Pegunungan (100% Gravitasi Alami)
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Pelanggan Terlayani:</span>
                    <strong className="text-white font-extrabold text-sm">{stats.lmbCustomers} Sambungan</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Kas Operasional:</span>
                    <strong className="text-amber-400 font-extrabold text-sm">Rp {stats.lmbCash.toLocaleString("id-ID")}</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Stand Fisik Meteran:</span>
                    <strong className="text-indigo-300 font-extrabold text-sm">
                      {stats.lmbPhysicalMeterM3.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} m³
                    </strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => scrollToSection("peta-gis")}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center justify-center space-x-1 mt-2"
              >
                <span>Lihat Sebaran di Peta GIS</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Unit 2: LMT (Tahap Persiapan) */}
            <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition space-y-4 opacity-90 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Unit 2 (LMT)
                  </span>
                  <span className="text-xs text-amber-400 font-bold flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Tahap Persiapan</span>
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-black text-slate-200">
                    KPSPAMS Lemo Tua
                  </h4>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Wilayah Layanan: Dusun Lemo Tua
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sumur Bor &amp; Sumber Air Baku
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Pelanggan Terdaftar:</span>
                    <strong className="text-slate-400 font-extrabold text-sm">0 Sambungan</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Kas Operasional:</span>
                    <strong className="text-slate-400 font-extrabold text-sm">Rp 0</strong>
                  </div>
                </div>
              </div>

              <div className="py-2.5 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/60 mt-2 font-medium">
                Penyusunan Jaringan Air Bersih
              </div>
            </div>

            {/* Unit 3: SRP (Tahap Persiapan) */}
            <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition space-y-4 opacity-90 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Unit 3 (SRP)
                  </span>
                  <span className="text-xs text-cyan-400 font-bold flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>Tahap Persiapan</span>
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-black text-slate-200">
                    KPSPAMS Sarampu 1
                  </h4>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Wilayah Layanan: Dusun Sarampu 1 &amp; Pakkandoang
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Jaringan Pipa &amp; Bak Penampung
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Pelanggan Terdaftar:</span>
                    <strong className="text-slate-400 font-extrabold text-sm">0 Sambungan</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Kas Operasional:</span>
                    <strong className="text-slate-400 font-extrabold text-sm">Rp 0</strong>
                  </div>
                </div>
              </div>

              <div className="py-2.5 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/60 mt-2 font-medium">
                Penyusunan Jaringan Air Bersih
              </div>
            </div>
          </div>
        </section>

        {/* Public Interactive GIS Map (Dusun Lemo Baru) */}
        <div id="peta-gis" className="scroll-mt-28">
          <PublicGisMapSection />
        </div>

        {/* Public Transparency & Performance Charts */}
        <div id="transparansi-kas" className="scroll-mt-28">
          <PublicTransparencyCharts />
        </div>

        {/* Feature Highlights Grid */}
        <section id="fitur-layanan" className="scroll-mt-28 space-y-4">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Keunggulan Layanan Air Minum Desa Kuajang
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Modern, tertib administrasi, dan transparan untuk seluruh masyarakat desa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-slate-900/60 hover:bg-slate-800/60 transition p-5 rounded-2xl border border-slate-800 flex items-start space-x-3.5 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-maroon-800/40 to-brand-maroon-950/80 border border-brand-maroon-700/60 text-brand-gold-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-maroon-950/30 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 stroke-[2.2] drop-shadow-[0_2px_4px_rgba(217,119,6,0.3)]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-brand-gold-300 transition-colors">Pencatatan Meter Digital</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Petugas mencatat meteran langsung di lapangan dengan foto bukti pemakaian air.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 hover:bg-slate-800/60 transition p-5 rounded-2xl border border-slate-800 flex items-start space-x-3.5 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5 stroke-[2.2] drop-shadow-[0_2px_4px_rgba(245,158,11,0.3)]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">Kwitansi &amp; Tarif Resmi</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Tarif iuran jelas sesuai musyawarah warga dengan bukti bayar resmi QR digital.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 hover:bg-slate-800/60 transition p-5 rounded-2xl border border-slate-800 flex items-start space-x-3.5 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition-transform">
                <Wallet className="w-5 h-5 stroke-[2.2] drop-shadow-[0_2px_4px_rgba(16,185,129,0.3)]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Kas Terbuka &amp; Rinci</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Setiap rupiah iuran warga dan biaya operasional tercatat rapi serta dapat diaudit.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 hover:bg-slate-800/60 transition p-5 rounded-2xl border border-slate-800 flex items-start space-x-3.5 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-500/40 text-sky-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/10 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5 stroke-[2.2] drop-shadow-[0_2px_4px_rgba(14,165,233,0.3)]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">Portal Mandiri Warga</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Cek tagihan bulanan, riwayat pembayaran, dan aduan pipa kapan saja dari HP.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pusat Bantuan & Pengaduan Warga */}
        <section id="pusat-bantuan" className="scroll-mt-28 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Pusat Bantuan &amp; Layanan Warga
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Pipa bocor, meteran macet, atau kendala air? Laporkan langsung melalui Portal Warga untuk penanganan cepat oleh pengurus KPSPAMS.
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                <span>📍 Posko: Dusun Lemo Baru</span>
                <span>•</span>
                <span>⏰ Jam Layanan: 08.00 - 17.00 WITA</span>
              </div>
            </div>
            <Link
              href="/portal"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-sm shadow-lg shadow-blue-600/25 transition active:scale-95 flex items-center space-x-2 whitespace-nowrap flex-shrink-0"
            >
              <span>Kirim Laporan Gangguan</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-6 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-300">© 2026 Pemerintah Desa Kuajang, Kec. Binuang, Kab. Polewali Mandar.</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Sistem Informasi Pengelolaan Air Minum dan Sanitasi Desa (SI-KPSPAMS) v1.0</p>
            </div>
            <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
              <Link href="/portal" className="hover:text-white transition">Portal Warga</Link>
              <span>•</span>
              <Link href="/login" className="hover:text-white transition">Login Pengurus</Link>
              <span>•</span>
              <span className="text-emerald-400 font-bold">Sistem Aktif &amp; Terlindungi</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <p>
              Dirancang &amp; Dikembangkan oleh <span className="text-brand-gold-400 font-bold">Pua Kaso</span> untuk Kemandirian Layanan Air Bersih Desa Kuajang.
            </p>
            <span className="text-slate-400 text-[10px]">Kecamatan Binuang, Polewali Mandar</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
