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

// Data penyaluran air bersih 7 hari terakhir (Liter/Hari) - Dusun Lemo Baru (Mata Air Pegunungan)
const DAILY_DISTRIBUTION_DATA = [
  { day: "Senin", volume: 14200, formatted: "14.200 L" },
  { day: "Selasa", volume: 13800, formatted: "13.800 L" },
  { day: "Rabu", volume: 15100, formatted: "15.100 L" },
  { day: "Kamis", volume: 14300, formatted: "14.300 L" },
  { day: "Jumat", volume: 14900, formatted: "14.900 L" },
  { day: "Sabtu", volume: 15600, formatted: "15.600 L" },
  { day: "Minggu", volume: 15200, formatted: "15.200 L" },
];

export type SystemViewKey = "ALL" | "LMB" | "LMT" | "SR1";

export interface AllocationItem {
  name: string;
  percent: number;
  value: number;
  color: string;
  icon: any;
  desc: string;
}

export interface SystemData {
  label: string;
  tabIcon: any;
  activeClass: string;
  title: string;
  subtitle: string;
  totalMonthly: number;
  note: string;
  allocations: AllocationItem[];
}

function buildSystemAllocation(lmbCash: number, lmtCash: number, sr1Cash: number): Record<SystemViewKey, SystemData> {
  const totalVillageCash = lmbCash + lmtCash + sr1Cash;

  const lmbAlloc1 = Math.round(lmbCash * 0.50);
  const lmbAlloc2 = Math.round(lmbCash * 0.25);
  const lmbAlloc3 = Math.max(0, lmbCash - lmbAlloc1 - lmbAlloc2);

  const allAlloc1 = Math.round(totalVillageCash * 0.50);
  const allAlloc2 = Math.round(totalVillageCash * 0.25);
  const allAlloc3 = Math.max(0, totalVillageCash - allAlloc1 - allAlloc2);

  return {
    LMB: {
      label: "Lemo Baru (Gravitasi)",
      tabIcon: Mountain,
      activeClass: "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25 font-black scale-[1.02]",
      title: "KPSPAMS Lemo Baru (Aktif)",
      subtitle: "Mata Air Alami Pegunungan • Bebas Listrik PLN • Sistem Gravitasi",
      totalMonthly: lmbCash,
      note: lmbCash > 0
        ? `Keunggulan Alami Lemo Baru: 100% menggunakan gravitasi pegunungan (0% biaya listrik PLN). Seluruh dana iuran warga terhimpun (Rp ${lmbCash.toLocaleString("id-ID")}) dialokasikan murni untuk perawatan pipa transmisi hulu, filter/kaporit, dan kas simpanan warga.`
        : "Keunggulan Alami Lemo Baru: 100% menggunakan sistem gravitasi alami pegunungan (0% biaya listrik PLN). Saldo kas awal saat ini Rp 0 (bersih). Seluruh penerimaan iuran warga yang masuk nantinya akan dialokasikan murni untuk pemeliharaan pipa transmisi pegunungan, kaporitisasi, dan kas warga.",
      allocations: [
        {
          name: "Pemeliharaan Pipa Transmisi Gravitasi",
          percent: 50,
          value: lmbAlloc1,
          color: "#06b6d4",
          icon: Wrench,
          desc: "Perawatan broncaptering mata air & pipa transmisi pegunungan",
        },
        {
          name: "Kaporitisasi & Filter Bak",
          percent: 25,
          value: lmbAlloc2,
          color: "#3b82f6",
          icon: Droplets,
          desc: "Klorinasi rutin bak penenang & filter pasir",
        },
        {
          name: "Kas Cadangan Warga",
          percent: 25,
          value: lmbAlloc3,
          color: "#a855f7",
          icon: PiggyBank,
          desc: "Tabungan kas warga untuk peremajaan pipa pecah",
        },
      ],
    },
    ALL: {
      label: "Semua Unit Desa",
      tabIcon: Globe2,
      activeClass: "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 font-black scale-[1.02]",
      title: "Konsolidasi Unit Desa Kuajang",
      subtitle: "Laporan Kas Terpadu Layanan Air Bersih Desa Kuajang",
      totalMonthly: totalVillageCash,
      note: totalVillageCash > 0
        ? `Laporan Konsolidasi: Pada Tahap 1, unit operasional yang aktif melayani warga adalah KPSPAMS Lemo Baru dengan total kas terhimpun Rp ${totalVillageCash.toLocaleString("id-ID")}. Unit Lemo Tua dan Sarampu 1 dalam tahap persiapan (0 SR).`
        : "Laporan Konsolidasi: Seluruh kas unit KPSPAMS berstatus Rp 0 (bersih). Unit Lemo Baru siap beroperasi dengan sistem gravitasi murni (0% listrik), unit Lemo Tua dan Sarampu 1 dalam tahap persiapan.",
      allocations: [
        {
          name: "Pemeliharaan Pipa Transmisi",
          percent: 50,
          value: allAlloc1,
          color: "#06b6d4",
          icon: Wrench,
          desc: "Perbaikan pipa bocor, klorinasi, & filter pasir",
        },
        {
          name: "Kaporitisasi & Filter Air",
          percent: 25,
          value: allAlloc2,
          color: "#3b82f6",
          icon: Droplets,
          desc: "Klorinasi rutin bak penenang air bersih",
        },
        {
          name: "Kas Cadangan & Kas Warga",
          percent: 25,
          value: allAlloc3,
          color: "#a855f7",
          icon: PiggyBank,
          desc: "Tabungan kas darurat untuk perbaikan jaringan desa",
        },
      ],
    },
    LMT: {
      label: "Lemo Tua (Tahap 2)",
      tabIcon: Zap,
      activeClass: "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25 font-black scale-[1.02]",
      title: "KPSPAMS Lemo Tua",
      subtitle: "Tahap 2 Persiapan Sambungan Rumah (0 SR Aktif)",
      totalMonthly: lmtCash,
      note: "Status Dusun Lemo Tua: Masih dalam tahap persiapan infrastruktur sambungan rumah (SR) dan tandon. Belum ada pungutan iuran atau saldo kas berjalan (Rp 0).",
      allocations: [
        {
          name: "Kas Operasional Berjalan",
          percent: 0,
          value: 0,
          color: "#64748b",
          icon: Wrench,
          desc: "Unit belum beroperasi komersial (Tahap Persiapan)",
        },
        {
          name: "Kas Cadangan Unit",
          percent: 0,
          value: 0,
          color: "#94a3b8",
          icon: PiggyBank,
          desc: "Saldo kas saat ini Rp 0",
        },
      ],
    },
    SR1: {
      label: "Sarampu 1 (Tahap 2)",
      tabIcon: Waves,
      activeClass: "bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/25 font-black scale-[1.02]",
      title: "KPSPAMS Sarampu 1",
      subtitle: "Tahap 2 Persiapan Sambungan Rumah (0 SR Aktif)",
      totalMonthly: sr1Cash,
      note: "Status Dusun Sarampu 1: Masih dalam tahap persiapan infrastruktur sambungan rumah (SR) dan pompa. Belum ada pungutan iuran atau saldo kas berjalan (Rp 0).",
      allocations: [
        {
          name: "Kas Operasional Berjalan",
          percent: 0,
          value: 0,
          color: "#64748b",
          icon: Wrench,
          desc: "Unit belum beroperasi komersial (Tahap Persiapan)",
        },
        {
          name: "Kas Cadangan Unit",
          percent: 0,
          value: 0,
          color: "#94a3b8",
          icon: PiggyBank,
          desc: "Saldo kas saat ini Rp 0",
        },
      ],
    },
  };
}

function formatRupiahDisplay(val: number): string {
  if (val >= 1000000) {
    return `Rp ${(val / 1000000).toFixed(1)} jt`;
  }
  return `Rp ${val.toLocaleString("id-ID")}`;
}

export function PublicTransparencyCharts() {
  const [mounted, setMounted] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<SystemViewKey>("LMB");
  const [systemDataMap, setSystemDataMap] = useState<Record<SystemViewKey, SystemData>>(() =>
    buildSystemAllocation(0, 0, 0)
  );

  useEffect(() => {
    setMounted(true);

    // Ambil data kas transparansi rill dari server database
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    fetch(`${apiBase}/portal/transparency`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.units) {
          const lmb = json.data.units.LMB?.cash ?? 0;
          const lmt = json.data.units.LMT?.cash ?? 0;
          const sr1 = json.data.units.SR1?.cash ?? 0;
          setSystemDataMap(buildSystemAllocation(lmb, lmt, sr1));
        }
      })
      .catch((err) => {
        console.warn("PublicTransparencyCharts: fallback to baseline zero cash", err);
      });
  }, []);

  const currentSystemData = systemDataMap[selectedSystem];

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
        <div className="lg:col-span-7 rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Backlight */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-cyan-500/25 via-sky-500/15 to-blue-600/20 border border-cyan-400/30 text-cyan-300 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/10 flex-shrink-0">
                  <Droplets className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] drop-shadow-[0_2px_8px_rgba(6,182,212,0.4)]" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-white">
                    Debit Air Bersih Tersalurkan (7 Hari Terakhir)
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Volume distribusi air bersih mata air pegunungan Dusun Lemo Baru
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block text-xs font-mono font-bold text-cyan-300 bg-cyan-950/90 border border-cyan-800/60 px-2.5 py-1 rounded-xl">
                Estimasi ~14.500 L / Hari
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
                              Kebutuhan air bersih warga Dusun Lemo Baru terpenuhi
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
            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-800/40 border border-slate-800">
              <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium truncate">Minggu Ini</span>
              <strong className="text-white font-black text-xs sm:text-sm">103.100 L</strong>
            </div>
            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-800/40 border border-slate-800">
              <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium truncate">Puncak Hari</span>
              <strong className="text-cyan-300 font-black text-xs sm:text-sm truncate block">Sabtu (15.6k L)</strong>
            </div>
            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-800/40 border border-slate-800">
              <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium truncate">Kualitas Air</span>
              <strong className="text-emerald-400 font-black text-xs sm:text-sm">pH 7.4 (Baku)</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Transparansi Penggunaan Dana Kas (5 Kolom di Desktop) */}
        <div className="lg:col-span-5 rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
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

            {/* Filter Pilihan Sistem: Lemo Baru vs Semua vs Lemo Tua vs Sarampu 1 */}
            <div className="flex items-center space-x-1.5 p-1.5 rounded-2xl bg-slate-950/90 border border-slate-800 mb-3.5 overflow-x-auto scrollbar-none no-scrollbar">
              {(["LMB", "ALL", "LMT", "SR1"] as SystemViewKey[]).map((key) => {
                const isAct = selectedSystem === key;
                const sys = systemDataMap[key];
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
                    data={currentSystemData.totalMonthly === 0
                      ? [{ name: "Tahap 2 Persiapan (0 SR)", value: 100, color: "#334155", percent: 0, desc: "Belum ada transaksi kas" }]
                      : currentSystemData.allocations}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={currentSystemData.totalMonthly === 0 ? 0 : 5}
                    dataKey="value"
                  >
                    {(currentSystemData.totalMonthly === 0
                      ? [{ color: "#334155" }]
                      : currentSystemData.allocations
                    ).map((entry, index) => (
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
                              <strong className="text-white">Rp {d.value.toLocaleString("id-ID")}</strong> ({d.percent ?? 0}%)
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
                  {formatRupiahDisplay(currentSystemData.totalMonthly)}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Total Kas Rill
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
                  className="p-2 sm:p-2.5 rounded-2xl bg-slate-800/30 hover:bg-slate-800/60 border border-slate-800/80 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2.5 sm:space-x-3 truncate">
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${item.color}28 0%, ${item.color}10 100%)`,
                        color: item.color,
                        border: `1px solid ${item.color}45`,
                        boxShadow: `0 2px 8px ${item.color}20, inset 0 1px 0 rgba(255,255,255,0.15)`,
                      }}
                    >
                      <IconComponent
                        className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.3]"
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
                      className="font-bold font-mono text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-lg inline-block border"
                      style={{
                        backgroundColor: `${item.color}20`,
                        color: item.color,
                        borderColor: `${item.color}40`,
                      }}
                    >
                      {item.percent}%
                    </span>
                    <div className="text-[10px] text-slate-300 font-bold font-mono mt-0.5">
                      {formatRupiahDisplay(item.value)}
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
