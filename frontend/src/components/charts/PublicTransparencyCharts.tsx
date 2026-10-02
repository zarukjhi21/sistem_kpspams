"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Droplet,
  Droplets,
  ShieldCheck,
  Zap,
  Wrench,
  Users2,
  PiggyBank,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Info,
  Globe2,
  Mountain,
  Waves,
  PieChart as PieChartIcon,
} from "lucide-react";

// Data penyaluran air bersih 7 hari terakhir (Liter/Hari)
const DAILY_DISTRIBUTION_DATA = [
  { day: "Senin", volume: 34200, formatted: "34.200 L" },
  { day: "Selasa", volume: 32800, formatted: "32.800 L" },
  { day: "Rabu", volume: 36500, formatted: "36.500 L" },
  { day: "Kamis", volume: 33100, formatted: "33.100 L" },
  { day: "Jumat", volume: 37900, formatted: "37.900 L" },
  { day: "Sabtu", volume: 39400, formatted: "39.400 L" },
  { day: "Minggu", volume: 38600, formatted: "38.600 L" },
];

// Data transparansi alokasi dana iuran kas berdasarkan sistem mata air gravitasi vs sumur bor
export type SystemViewKey = "ALL" | "LMB" | "LMT" | "SR1";

const FUND_ALLOCATION_BY_SYSTEM = {
  ALL: {
    label: "Semua Unit Desa",
    tabIcon: Globe2,
    activeClass: "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 font-black scale-[1.02]",
    title: "Konsolidasi 3 Unit Desa Kuajang",
    subtitle: "Konsolidasi Unit Desa Kuajang (Pilot 185 SR Lemo Baru & Persiapan Tahap 2)",
    totalMonthly: 14000000,
    note: "Laporan konsolidasi seluruh desa: menggabungkan efisiensi sistem gravitasi murni Lemo Baru (0% listrik) dengan pembiayaan listrik pompa bor Lemo Tua dan Sarampu 1.",
    allocations: [
      {
        name: "Listrik PLN & BBM Pompa Bor",
        percent: 45,
        value: 6300000,
        color: "#f59e0b",
        icon: Zap,
        desc: "Operasional pompa submersible sumur bor Lemo Tua & Sarampu 1",
      },
      {
        name: "Pemeliharaan Pipa & Kaporit",
        percent: 25,
        value: 3500000,
        color: "#06b6d4",
        icon: Wrench,
        desc: "Perbaikan pipa bocor, klorinasi, & filter pasir",
      },
      {
        name: "Honor Petugas Lapangan",
        percent: 15,
        value: 2100000,
        color: "#10b981",
        icon: Users2,
        desc: "Petugas transmisi hulu, catat meter dusun & kasir",
      },
      {
        name: "Kas Cadangan Dana Darurat",
        percent: 15,
        value: 2100000,
        color: "#a855f7",
        icon: PiggyBank,
        desc: "Dana simpanan desa untuk pemeliharaan & kas darurat",
      },
    ],
  },
  LMB: {
    label: "Lemo Baru (Gravitasi)",
    tabIcon: Mountain,
    activeClass: "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25 font-black scale-[1.02]",
    title: "KPSPAMS Lemo Baru",
    subtitle: "Mata Air Alami Pegunungan • Bebas Listrik PLN • 185 SR",
    totalMonthly: 4500000,
    note: "Keunggulan Alami Lemo Baru: 100% menggunakan gravitasi alamiah dari sumber mata air pegunungan (0% listrik PLN). Seluruh dana iuran dialokasikan murni untuk pemeliharaan pipa transmisi pegunungan, kaporitisasi, dan kas warga.",
    allocations: [
      {
        name: "Pemeliharaan Pipa Transmisi Gravitasi",
        percent: 45,
        value: 2025000,
        color: "#06b6d4",
        icon: Wrench,
        desc: "Perawatan broncaptering mata air & pipa transmisi pegunungan",
      },
      {
        name: "Kaporitisasi & Filter Bak",
        percent: 20,
        value: 900000,
        color: "#3b82f6",
        icon: Droplets,
        desc: "Klorinasi rutin tandon penenang & filter pasir",
      },
      {
        name: "Honor Petugas Transmisi & Catat",
        percent: 20,
        value: 900000,
        color: "#10b981",
        icon: Users2,
        desc: "Inspeksi jalur transmisi hulu & pencatatan meteran warga",
      },
      {
        name: "Kas Cadangan & Kas Warga",
        percent: 15,
        value: 675000,
        color: "#a855f7",
        icon: PiggyBank,
        desc: "Tabungan kas warga untuk peremajaan pipa pecah",
      },
    ],
  },
  LMT: {
    label: "Lemo Tua (Sumur Bor)",
    tabIcon: Zap,
    activeClass: "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25 font-black scale-[1.02]",
    title: "KPSPAMS Lemo Tua",
    subtitle: "Sumur Bor Mandiri Dusun Lemo Tua • 142 SR",
    totalMonthly: 3800000,
    note: "KPSPAMS Lemo Tua mengoperasikan sumur bor dalam mandiri dengan pompa submersible listrik PLN berdaya tinggi untuk melayani 142 Sambungan Rumah di Dusun Lemo Tua.",
    allocations: [
      {
        name: "Listrik PLN Pompa Bor",
        percent: 48,
        value: 1824000,
        color: "#f59e0b",
        icon: Zap,
        desc: "Token listrik PLN pompa submersible 3-phase Dusun Lemo Tua",
      },
      {
        name: "Perawatan Pompa Bor & Pipa",
        percent: 22,
        value: 836000,
        color: "#06b6d4",
        icon: Wrench,
        desc: "Servis motor pompa, kaporit, & perbaikan pipa distribusi",
      },
      {
        name: "Honor Petugas Operator",
        percent: 15,
        value: 570000,
        color: "#10b981",
        icon: Users2,
        desc: "Operator pompa bor & pencatatan meteran warga Lemo Tua",
      },
      {
        name: "Kas Cadangan Mesin & Tandon",
        percent: 15,
        value: 570000,
        color: "#a855f7",
        icon: PiggyBank,
        desc: "Dana darurat cadangan perbaikan dinamo submersible",
      },
    ],
  },
  SR1: {
    label: "Sarampu 1 & Pakkandoang",
    tabIcon: Waves,
    activeClass: "bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/25 font-black scale-[1.02]",
    title: "KPSPAMS Sarampu 1",
    subtitle: "Sumur Bor Kapasitas Besar • Melayani 2 Dusun • 278 SR",
    totalMonthly: 5700000,
    note: "KPSPAMS Sarampu 1 mengoperasikan sumur bor kapasitas besar dengan pompa submersible listrik PLN yang mendistribusikan air bersih ke dua wilayah: Dusun Sarampu 1 dan Dusun Pakkandoang.",
    allocations: [
      {
        name: "Listrik PLN Pompa Bor (2 Dusun)",
        percent: 49,
        value: 2793000,
        color: "#f59e0b",
        icon: Zap,
        desc: "Token listrik PLN pompa bor kapasitas besar 24 jam",
      },
      {
        name: "Pemeliharaan Jaringan Pipa 2 Dusun",
        percent: 21,
        value: 1197000,
        color: "#06b6d4",
        icon: Wrench,
        desc: "Perawatan pipa distribusi jarak jauh ke Sarampu 1 & Pakkandoang",
      },
      {
        name: "Honor Petugas Lapangan & Operator",
        percent: 15,
        value: 855000,
        color: "#10b981",
        icon: Users2,
        desc: "Operator pompa sumur bor & petugas catat meter 2 dusun",
      },
      {
        name: "Kas Cadangan Penggantian Pompa",
        percent: 15,
        value: 855000,
        color: "#a855f7",
        icon: PiggyBank,
        desc: "Tabungan kas darurat penggantian pompa submersible",
      },
    ],
  },
};

export function PublicTransparencyCharts() {
  const [mounted, setMounted] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<SystemViewKey>("ALL");

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentSystemData = FUND_ALLOCATION_BY_SYSTEM[selectedSystem];

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
        <div className="lg:col-span-7 h-80 bg-slate-800/40 rounded-3xl border border-slate-800" />
        <div className="lg:col-span-5 h-80 bg-slate-800/40 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Transparansi Publik & Akuntabilitas Warga</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Transparansi Penyaluran Air & Akuntabilitas Dana Desa
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Laporan terbuka konsumsi debit air harian serta rincian penggunaan uang iuran warga Desa Kuajang secara jujur dan dapat diaudit bersama.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700/80 text-xs text-slate-300 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Penyaluran Normal 99.4%</span>
          </div>
        </div>
      </div>

      {/* Grid: 2 Visual Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Grafik Debit Air Harian (7 Kolom di Desktop) */}
        <div className="lg:col-span-7 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Backlight */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/25 via-sky-500/15 to-blue-600/20 border border-cyan-400/30 text-cyan-300 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/10">
                  <Droplets className="w-6 h-6 stroke-[2.2] drop-shadow-[0_2px_8px_rgba(6,182,212,0.4)]" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white">
                    Debit Air Bersih Tersalurkan (7 Hari Terakhir)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Volume distribusi air bersih ke 4 dusun (Lemo Baru, Lemo Tua, Sarampu 1, Pakkandoang)
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block text-xs font-mono font-bold text-cyan-300 bg-cyan-950/90 border border-cyan-800/60 px-2.5 py-1 rounded-xl">
                Estimasi ~36.000 L / Hari
              </span>
            </div>

            {/* Recharts Area Spline Chart */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={DAILY_DISTRIBUTION_DATA}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="cyanGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k L`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const val = Number(payload[0]?.value || 0);
                        return (
                          <div className="bg-slate-950/95 backdrop-blur text-white p-3 rounded-2xl shadow-2xl border border-cyan-500/30 text-xs space-y-1">
                            <div className="font-bold text-cyan-400 border-b border-slate-800 pb-1">
                              Hari {label}
                            </div>
                            <div className="flex items-center space-x-2 pt-0.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                              <span className="text-slate-300">Volume Terdistribusi:</span>
                              <strong className="text-white font-mono text-sm">
                                {val.toLocaleString("id-ID")} Liter
                              </strong>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              Kebutuhan air bersih warga Desa Kuajang terpenuhi
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#cyanGlow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Highlight Stats */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs mt-2">
            <div className="p-2 rounded-2xl bg-slate-800/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Akumulasi Minggu Ini</span>
              <strong className="text-white font-black text-sm">252.500 L</strong>
            </div>
            <div className="p-2 rounded-2xl bg-slate-800/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Puncak Distribusi</span>
              <strong className="text-cyan-300 font-black text-sm">Sabtu (39.400 L)</strong>
            </div>
            <div className="p-2 rounded-2xl bg-slate-800/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Kualitas Air PH</span>
              <strong className="text-emerald-400 font-black text-sm">7.2 (Standar Baku)</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Transparansi Penggunaan Dana Kas (5 Kolom di Desktop) */}
        <div className="lg:col-span-5 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* Ambient Amber Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/25 via-orange-500/15 to-amber-600/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-white/10">
                  <PieChartIcon className="w-6 h-6 stroke-[2.2] drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white">
                    Alokasi Dana Iuran Air Warga
                  </h4>
                  <p className="text-xs text-slate-400">
                    Transparansi penggunaan dana kas bulanan
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Pilihan Sistem: Semua vs Lemo Baru vs Lemo Tua vs Sarampu 1 */}
            <div className="flex items-center space-x-1.5 p-1.5 rounded-2xl bg-slate-950/90 border border-slate-800 mb-3.5 overflow-x-auto scrollbar-none no-scrollbar">
              {(["ALL", "LMB", "LMT", "SR1"] as SystemViewKey[]).map((key) => {
                const isAct = selectedSystem === key;
                const sys = FUND_ALLOCATION_BY_SYSTEM[key];
                const TabIcon = sys.tabIcon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedSystem(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                      isAct
                        ? sys.activeClass
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <TabIcon className={`w-3.5 h-3.5 ${isAct ? "text-slate-950 stroke-[2.5]" : "text-slate-400"}`} />
                    <span>{sys.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] font-semibold text-amber-300/90 mb-2">
              {currentSystemData.title} &bull; <span className="text-slate-400 font-normal">{currentSystemData.subtitle}</span>
            </div>

            {/* Donut Chart Alokasi Kas */}
            <div className="h-44 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentSystemData.allocations}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {currentSystemData.allocations.map((entry, index) => (
                      <Cell key={`cell-fund-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-950 text-white p-2.5 rounded-xl shadow-xl border border-slate-800 text-xs">
                            <div className="font-bold flex items-center space-x-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: d.color }}
                              />
                              <span>{d.name}</span>
                            </div>
                            <div className="mt-1 text-slate-300">
                              <strong className="text-white">Rp {d.value.toLocaleString("id-ID")}</strong> ({d.percent}%)
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">{d.desc}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-black text-white font-tabular tracking-tight">
                  Rp {(currentSystemData.totalMonthly / 1000000).toFixed(1)} jt
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Total / Bulan
                </span>
              </div>
            </div>
          </div>

          {/* Allocation Breakdown List with Crisp High-Res Icons */}
          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            {currentSystemData.allocations.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-slate-800/30 hover:bg-slate-800/60 border border-slate-800/80 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${item.color}28 0%, ${item.color}10 100%)`,
                        color: item.color,
                        border: `1px solid ${item.color}45`,
                        boxShadow: `0 2px 8px ${item.color}20, inset 0 1px 0 rgba(255,255,255,0.15)`,
                      }}
                    >
                      <IconComponent
                        className="w-5 h-5 stroke-[2.3]"
                        style={{ filter: `drop-shadow(0 2px 4px ${item.color}40)` }}
                      />
                    </div>
                    <div className="truncate">
                      <div className="font-extrabold text-white text-xs truncate group-hover:text-amber-200 transition-colors">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span
                      className="font-bold font-mono text-xs px-2.5 py-0.5 rounded-lg inline-block border"
                      style={{
                        backgroundColor: `${item.color}20`,
                        color: item.color,
                        borderColor: `${item.color}40`,
                      }}
                    >
                      {item.percent}%
                    </span>
                    <div className="text-[10px] text-slate-300 font-bold font-mono mt-0.5">
                      Rp {(item.value / 1000000).toFixed(1)} jt
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Catatan Penjelas Sistem Khusus (Gravitasi vs Sumur Bor) */}
          <div className="mt-3.5 p-3 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start space-x-2.5 shadow-sm">
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm text-amber-300">
              <Sparkles className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <p className="leading-relaxed text-[11px] text-slate-300">{currentSystemData.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
