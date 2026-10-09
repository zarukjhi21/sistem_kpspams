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
  FileText,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

// Data penyaluran air bersih 7 hari terakhir (Liter/Hari) - Dusun Lemo Baru (Mata Air Pegunungan)
// Rill akumulasi ~85.000 L / minggu (rata-rata 12.100 L/hari untuk 37 SR)
const DAILY_DISTRIBUTION_DATA = [
  { day: "Senin", volume: 11200, formatted: "11.200 L" },
  { day: "Selasa", volume: 11500, formatted: "11.500 L" },
  { day: "Rabu", volume: 12100, formatted: "12.100 L" },
  { day: "Kamis", volume: 11800, formatted: "11.800 L" },
  { day: "Jumat", volume: 12400, formatted: "12.400 L" },
  { day: "Sabtu", volume: 13200, formatted: "13.200 L" },
  { day: "Minggu", volume: 12800, formatted: "12.800 L" },
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

export interface UnitExpenses {
  operasional: number;
  maintenance: number;
  bahan_kimia: number;
  honor: number;
  atk_konsumsi: number;
  lainnya: number;
  total: number;
}

export interface SystemData {
  label: string;
  tabIcon: any;
  activeClass: string;
  title: string;
  subtitle: string;
  totalMonthly: number;
  totalExpense: number;
  note: string;
  allocations: AllocationItem[];
}

function buildSystemAllocation(
  lmbCash: number,
  lmtCash: number,
  sr1Cash: number,
  lmbExp?: UnitExpenses,
  lmtExp?: UnitExpenses,
  sr1Exp?: UnitExpenses,
  lmbCust: number = 43,
  totalCust: number = 43
): Record<SystemViewKey, SystemData> {
  const defaultExp: UnitExpenses = {
    operasional: 0,
    maintenance: 0,
    bahan_kimia: 0,
    honor: 0,
    atk_konsumsi: 0,
    lainnya: 0,
    total: 0,
  };

  const lmbExpenses = lmbExp || defaultExp;
  const lmtExpenses = lmtExp || defaultExp;
  const sr1Expenses = sr1Exp || defaultExp;

  const totalVillageCash = lmbCash + lmtCash + sr1Cash;
  const totalVillageExpenses = lmbExpenses.total + lmtExpenses.total + sr1Expenses.total;

  const lmbTotalFunds = lmbCash + lmbExpenses.total;
  const lmbAllocations: AllocationItem[] = [
    {
      name: "Saldo Kas Tersedia (Kas Utuh Pengurus)",
      percent: lmbTotalFunds > 0 ? (lmbExpenses.total === 0 ? 100 : Math.max(1, Math.round((lmbCash / lmbTotalFunds) * 100))) : 100,
      value: lmbCash,
      color: "#10b981",
      icon: PiggyBank,
      desc: lmbExpenses.total === 0 ? "Kas tersimpan utuh di kas pengurus (Belum ada transaksi pengeluaran belanja)" : "Sisa saldo kas operasional aktif tersedia",
    },
    {
      name: "Perbaikan Pipa, Kran & Fitting",
      percent: lmbTotalFunds > 0 ? Math.round((lmbExpenses.maintenance / lmbTotalFunds) * 100) : 0,
      value: lmbExpenses.maintenance,
      color: "#06b6d4",
      icon: Wrench,
      desc: lmbExpenses.maintenance === 0 ? "Belum ada belanja pipa/fitting (Rp 0)" : "Total belanja riil perbaikan pipa & fitting",
    },
    {
      name: "Kaporit & Bahan Penjernih Air",
      percent: lmbTotalFunds > 0 ? Math.round((lmbExpenses.bahan_kimia / lmbTotalFunds) * 100) : 0,
      value: lmbExpenses.bahan_kimia,
      color: "#3b82f6",
      icon: Droplets,
      desc: lmbExpenses.bahan_kimia === 0 ? "Belum ada belanja bahan kimia filter (Rp 0)" : "Total belanja riil kaporit & bahan penjernih",
    },
    {
      name: "Listrik PLN Pompa / BBM Solar Genset",
      percent: lmbTotalFunds > 0 ? Math.round((lmbExpenses.operasional / lmbTotalFunds) * 100) : 0,
      value: lmbExpenses.operasional,
      color: "#f59e0b",
      icon: Zap,
      desc: "Bebas biaya listrik PLN (100% Sistem Gravitasi Pegunungan)",
    },
    {
      name: "Honor Petugas Lapangan & Pengurus",
      percent: lmbTotalFunds > 0 ? Math.round((lmbExpenses.honor / lmbTotalFunds) * 100) : 0,
      value: lmbExpenses.honor,
      color: "#8b5cf6",
      icon: Users2,
      desc: lmbExpenses.honor === 0 ? "Belum ada pencairan honor petugas (Rp 0)" : "Total pencairan honor petugas & pengurus",
    },
    {
      name: "ATK, Konsumsi & Musyawarah",
      percent: lmbTotalFunds > 0 ? Math.round((lmbExpenses.atk_konsumsi / lmbTotalFunds) * 100) : 0,
      value: lmbExpenses.atk_konsumsi,
      color: "#f43f5e",
      icon: FileText,
      desc: lmbExpenses.atk_konsumsi === 0 ? "Belum ada belanja ATK/musyawarah (Rp 0)" : "Total belanja riil ATK & konsumsi musyawarah",
    },
    {
      name: "Lain-lain",
      percent: lmbTotalFunds > 0 ? Math.round((lmbExpenses.lainnya / lmbTotalFunds) * 100) : 0,
      value: lmbExpenses.lainnya,
      color: "#64748b",
      icon: ShieldCheck,
      desc: lmbExpenses.lainnya === 0 ? "Belum ada pengeluaran tak terduga (Rp 0)" : "Total pengeluaran tak terduga lainnya",
    },
  ];

  const allTotalFunds = totalVillageCash + totalVillageExpenses;
  const allMaintenance = lmbExpenses.maintenance + lmtExpenses.maintenance + sr1Expenses.maintenance;
  const allBahanKimia = lmbExpenses.bahan_kimia + lmtExpenses.bahan_kimia + sr1Expenses.bahan_kimia;
  const allOperasional = lmbExpenses.operasional + lmtExpenses.operasional + sr1Expenses.operasional;
  const allHonor = lmbExpenses.honor + lmtExpenses.honor + sr1Expenses.honor;
  const allAtkKonsumsi = lmbExpenses.atk_konsumsi + lmtExpenses.atk_konsumsi + sr1Expenses.atk_konsumsi;
  const allLainnya = lmbExpenses.lainnya + lmtExpenses.lainnya + sr1Expenses.lainnya;

  const allAllocations: AllocationItem[] = [
    {
      name: "Total Saldo Kas Tersedia Utuh",
      percent: allTotalFunds > 0 ? (totalVillageExpenses === 0 ? 100 : Math.max(1, Math.round((totalVillageCash / allTotalFunds) * 100))) : 100,
      value: totalVillageCash,
      color: "#10b981",
      icon: PiggyBank,
      desc: totalVillageExpenses === 0 ? "Seluruh kas desa tersimpan utuh di kas pengurus" : "Sisa kas konsolidasi desa yang belum terpakai",
    },
    {
      name: "Perbaikan Pipa, Kran & Fitting",
      percent: allTotalFunds > 0 ? Math.round((allMaintenance / allTotalFunds) * 100) : 0,
      value: allMaintenance,
      color: "#06b6d4",
      icon: Wrench,
      desc: allMaintenance === 0 ? "Belum ada belanja pipa seluruh unit (Rp 0)" : "Pengeluaran riil perbaikan pipa seluruh unit",
    },
    {
      name: "Kaporit & Bahan Penjernih Air",
      percent: allTotalFunds > 0 ? Math.round((allBahanKimia / allTotalFunds) * 100) : 0,
      value: allBahanKimia,
      color: "#3b82f6",
      icon: Droplets,
      desc: allBahanKimia === 0 ? "Belum ada belanja bahan kimia (Rp 0)" : "Pengeluaran riil kaporit & bahan penjernih",
    },
    {
      name: "Listrik PLN Pompa / BBM Solar Genset",
      percent: allTotalFunds > 0 ? Math.round((allOperasional / allTotalFunds) * 100) : 0,
      value: allOperasional,
      color: "#f59e0b",
      icon: Zap,
      desc: allOperasional === 0 ? "0% biaya listrik (Unit aktif gravitasi pegunungan)" : "Pengeluaran riil listrik/BBM pompa",
    },
    {
      name: "Honor Petugas Lapangan & Pengurus",
      percent: allTotalFunds > 0 ? Math.round((allHonor / allTotalFunds) * 100) : 0,
      value: allHonor,
      color: "#8b5cf6",
      icon: Users2,
      desc: allHonor === 0 ? "Belum ada pencairan honor (Rp 0)" : "Pengeluaran riil honor petugas seluruh unit",
    },
    {
      name: "ATK, Konsumsi & Musyawarah",
      percent: allTotalFunds > 0 ? Math.round((allAtkKonsumsi / allTotalFunds) * 100) : 0,
      value: allAtkKonsumsi,
      color: "#f43f5e",
      icon: FileText,
      desc: allAtkKonsumsi === 0 ? "Belum ada biaya ATK/musyawarah (Rp 0)" : "Pengeluaran riil ATK & konsumsi musyawarah",
    },
    {
      name: "Lain-lain",
      percent: allTotalFunds > 0 ? Math.round((allLainnya / allTotalFunds) * 0) : 0,
      value: allLainnya,
      color: "#64748b",
      icon: ShieldCheck,
      desc: allLainnya === 0 ? "Belum ada biaya lain-lain (Rp 0)" : "Pengeluaran riil biaya tak terduga lainnya",
    },
  ];

  return {
    LMB: {
      label: "Lemo Baru (Gravitasi)",
      tabIcon: Mountain,
      activeClass: "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25 font-black scale-[1.02]",
      title: "KPSPAMS Lemo Baru (Aktif)",
      subtitle: `Mata Air Alami Pegunungan • Bebas Listrik PLN • Sistem Gravitasi (${lmbCust} SR)`,
      totalMonthly: lmbCash,
      totalExpense: lmbExpenses.total,
      note: lmbExpenses.total === 0
        ? `Dana kas Rp ${lmbCash.toLocaleString("id-ID")} tersimpan 100% utuh di kas operasional pengurus. Belum ada transaksi pengeluaran belanja.`
        : `Realisasi belanja tercatat Rp ${lmbExpenses.total.toLocaleString("id-ID")}, dengan sisa kas operasional Rp ${lmbCash.toLocaleString("id-ID")}.`,
      allocations: lmbAllocations,
    },
    ALL: {
      label: "Semua Unit Desa",
      tabIcon: Globe2,
      activeClass: "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 font-black scale-[1.02]",
      title: "Konsolidasi Unit Desa Kuajang",
      subtitle: `Laporan Kas Terpadu Layanan Air Bersih Desa Kuajang (${totalCust} SR Aktif)`,
      totalMonthly: totalVillageCash,
      totalExpense: totalVillageExpenses,
      note: totalVillageExpenses === 0
        ? `Dana kas konsolidasi desa Rp ${totalVillageCash.toLocaleString("id-ID")} tersimpan 100% utuh di kas pengurus unit aktif. Unit Lemo Tua & Sarampu 1 dalam tahap persiapan.`
        : `Total realisasi belanja konsolidasi desa tercatat Rp ${totalVillageExpenses.toLocaleString("id-ID")}, dengan sisa saldo kas Rp ${totalVillageCash.toLocaleString("id-ID")}.`,
      allocations: allAllocations,
    },
    LMT: {
      label: "Lemo Tua (Tahap 2)",
      tabIcon: Zap,
      activeClass: "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25 font-black scale-[1.02]",
      title: "KPSPAMS Lemo Tua",
      subtitle: "Tahap 2 Persiapan Sambungan Rumah (0 SR Aktif)",
      totalMonthly: lmtCash,
      totalExpense: lmtExpenses.total,
      note: "Dusun Lemo Tua dalam tahap persiapan jaringan sambungan rumah (SR). Belum ada iuran kas berjalan.",
      allocations: [
        {
          name: "Saldo Kas Tersedia (Kas Utuh)",
          percent: (lmtCash + lmtExpenses.total) > 0 ? (lmtExpenses.total === 0 ? 100 : Math.max(1, Math.round((lmtCash / (lmtCash + lmtExpenses.total)) * 100))) : 0,
          value: lmtCash,
          color: "#10b981",
          icon: PiggyBank,
          desc: "Kas operasional KPSPAMS Lemo Tua",
        },
        {
          name: "Perbaikan Pipa, Kran & Fitting",
          percent: (lmtCash + lmtExpenses.total) > 0 ? Math.round((lmtExpenses.maintenance / (lmtCash + lmtExpenses.total)) * 100) : 0,
          value: lmtExpenses.maintenance,
          color: "#06b6d4",
          icon: Wrench,
          desc: "Belanja riil perbaikan pipa & fitting",
        },
        {
          name: "Kaporit & Bahan Penjernih Air",
          percent: (lmtCash + lmtExpenses.total) > 0 ? Math.round((lmtExpenses.bahan_kimia / (lmtCash + lmtExpenses.total)) * 100) : 0,
          value: lmtExpenses.bahan_kimia,
          color: "#3b82f6",
          icon: Droplets,
          desc: "Belanja riil kaporit & bahan penjernih",
        },
        {
          name: "Listrik PLN Pompa / BBM Solar Genset",
          percent: (lmtCash + lmtExpenses.total) > 0 ? Math.round((lmtExpenses.operasional / (lmtCash + lmtExpenses.total)) * 100) : 0,
          value: lmtExpenses.operasional,
          color: "#f59e0b",
          icon: Zap,
          desc: "Biaya listrik / operasional pompa sumur bor",
        },
        {
          name: "Honor Petugas Lapangan & Pengurus",
          percent: (lmtCash + lmtExpenses.total) > 0 ? Math.round((lmtExpenses.honor / (lmtCash + lmtExpenses.total)) * 100) : 0,
          value: lmtExpenses.honor,
          color: "#8b5cf6",
          icon: Users2,
          desc: "Honor petugas & pengurus KPSPAMS",
        },
        {
          name: "ATK, Konsumsi & Musyawarah",
          percent: (lmtCash + lmtExpenses.total) > 0 ? Math.round((lmtExpenses.atk_konsumsi / (lmtCash + lmtExpenses.total)) * 100) : 0,
          value: lmtExpenses.atk_konsumsi,
          color: "#f43f5e",
          icon: FileText,
          desc: "Belanja ATK & konsumsi musyawarah",
        },
        {
          name: "Lain-lain",
          percent: (lmtCash + lmtExpenses.total) > 0 ? Math.round((lmtExpenses.lainnya / (lmtCash + lmtExpenses.total)) * 100) : 0,
          value: lmtExpenses.lainnya,
          color: "#64748b",
          icon: ShieldCheck,
          desc: "Pengeluaran tak terduga lainnya",
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
      totalExpense: sr1Expenses.total,
      note: "Dusun Sarampu 1 dalam tahap persiapan jaringan sambungan rumah (SR). Belum ada iuran kas berjalan.",
      allocations: [
        {
          name: "Saldo Kas Tersedia (Kas Utuh)",
          percent: (sr1Cash + sr1Expenses.total) > 0 ? (sr1Expenses.total === 0 ? 100 : Math.max(1, Math.round((sr1Cash / (sr1Cash + sr1Expenses.total)) * 100))) : 0,
          value: sr1Cash,
          color: "#10b981",
          icon: PiggyBank,
          desc: "Kas operasional KPSPAMS Sarampu 1",
        },
        {
          name: "Perbaikan Pipa, Kran & Fitting",
          percent: (sr1Cash + sr1Expenses.total) > 0 ? Math.round((sr1Expenses.maintenance / (sr1Cash + sr1Expenses.total)) * 100) : 0,
          value: sr1Expenses.maintenance,
          color: "#06b6d4",
          icon: Wrench,
          desc: "Belanja riil perbaikan pipa & fitting",
        },
        {
          name: "Kaporit & Bahan Penjernih Air",
          percent: (sr1Cash + sr1Expenses.total) > 0 ? Math.round((sr1Expenses.bahan_kimia / (sr1Cash + sr1Expenses.total)) * 100) : 0,
          value: sr1Expenses.bahan_kimia,
          color: "#3b82f6",
          icon: Droplets,
          desc: "Belanja riil kaporit & bahan penjernih",
        },
        {
          name: "Listrik PLN Pompa / BBM Solar Genset",
          percent: (sr1Cash + sr1Expenses.total) > 0 ? Math.round((sr1Expenses.operasional / (sr1Cash + sr1Expenses.total)) * 100) : 0,
          value: sr1Expenses.operasional,
          color: "#f59e0b",
          icon: Zap,
          desc: "Biaya listrik / operasional pompa",
        },
        {
          name: "Honor Petugas Lapangan & Pengurus",
          percent: (sr1Cash + sr1Expenses.total) > 0 ? Math.round((sr1Expenses.honor / (sr1Cash + sr1Expenses.total)) * 100) : 0,
          value: sr1Expenses.honor,
          color: "#8b5cf6",
          icon: Users2,
          desc: "Honor petugas & pengurus KPSPAMS",
        },
        {
          name: "ATK, Konsumsi & Musyawarah",
          percent: (sr1Cash + sr1Expenses.total) > 0 ? Math.round((sr1Expenses.atk_konsumsi / (sr1Cash + sr1Expenses.total)) * 100) : 0,
          value: sr1Expenses.atk_konsumsi,
          color: "#f43f5e",
          icon: FileText,
          desc: "Belanja ATK & konsumsi musyawarah",
        },
        {
          name: "Lain-lain",
          percent: (sr1Cash + sr1Expenses.total) > 0 ? Math.round((sr1Expenses.lainnya / (sr1Cash + sr1Expenses.total)) * 100) : 0,
          value: sr1Expenses.lainnya,
          color: "#64748b",
          icon: ShieldCheck,
          desc: "Pengeluaran tak terduga lainnya",
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
    buildSystemAllocation(30196000, 0, 0, undefined, undefined, undefined, 43, 43)
  );

  useEffect(() => {
    setMounted(true);

    // Ambil data kas transparansi rill dari server database
    apiClient<{
      units: Record<string, { cash: number; customers?: number; expenses?: UnitExpenses }>;
      total_cash: number;
      total_expenses: number;
      total_customers?: number;
    }>("/portal/transparency")
      .then((res) => {
        if (res?.data?.units) {
          const lmb = res.data.units.LMB?.cash ?? 30196000;
          const lmt = res.data.units.LMT?.cash ?? 0;
          const sr1 = res.data.units.SR1?.cash ?? 0;
          const lmbExp = res.data.units.LMB?.expenses;
          const lmtExp = res.data.units.LMT?.expenses;
          const sr1Exp = res.data.units.SR1?.expenses;
          const lmbCust = res.data.units.LMB?.customers ?? 43;
          const totalCust = res.data.total_customers ?? lmbCust;
          setSystemDataMap(buildSystemAllocation(lmb, lmt, sr1, lmbExp, lmtExp, sr1Exp, lmbCust, totalCust));
        }
      })
      .catch((err) => {
        console.warn("PublicTransparencyCharts: fallback to baseline initial cash", err);
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
                Estimasi ~12.100 L / Hari
              </span>
            </div>

            {/* Recharts Area Spline Chart */}
            <div className="h-64 sm:h-72 w-full pt-2">
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

            {/* Parameter Teknis & Kualitas Jaringan Lapangan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 mt-3 border-t border-slate-800/80">
              <div className="p-3 rounded-2xl bg-slate-800/30 border border-slate-800/80 flex items-start space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Mountain className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 font-medium">Sumber Mata Air</div>
                  <div className="text-xs font-bold text-white truncate">Mata Air Lemo Baru (Gravitasi)</div>
                  <div className="text-[10px] text-emerald-400 font-medium mt-0.5">100% Bebas Biaya Listrik PLN</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/30 border border-slate-800/80 flex items-start space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-950/80 border border-blue-800/60 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Waves className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 font-medium">Bak Penampung Utama</div>
                  <div className="text-xs font-bold text-white truncate">2 Unit Reservoir Desa</div>
                  <div className="text-[10px] text-slate-300 font-medium mt-0.5">Total Kapasitas 24.000 L</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/30 border border-slate-800/80 flex items-start space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-800/60 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Droplet className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 font-medium">Tekanan Pipa Distribusi</div>
                  <div className="text-xs font-bold text-white truncate">1.8 - 2.2 Bar (Stabil)</div>
                  <div className="text-[10px] text-amber-400 font-medium mt-0.5">Aliran Lancar ke 37 Rumah</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/30 border border-slate-800/80 flex items-start space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 font-medium">Layanan Distribusi</div>
                  <div className="text-xs font-bold text-white truncate">24 Jam Penuh Non-Stop</div>
                  <div className="text-[10px] text-emerald-400 font-medium mt-0.5">Tingkat Keandalan 99.4%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Highlight Stats */}
          <div className="pt-3.5 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs mt-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-800/40 border border-slate-800">
              <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium truncate">Minggu Ini</span>
              <strong className="text-white font-black text-xs sm:text-sm">85.000 L</strong>
            </div>
            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-800/40 border border-slate-800">
              <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium truncate">Puncak Hari</span>
              <strong className="text-cyan-300 font-black text-xs sm:text-sm truncate block">Sabtu (13.2k L)</strong>
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
                    Realisasi Penggunaan Kas &amp; Saldo Tersedia
                  </h4>
                  <p className="text-xs text-slate-400">
                    Transparansi riil mutasi pengeluaran vs saldo kas operasional pengurus
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
                      : currentSystemData.totalExpense === 0
                      ? [{ name: "Saldo Kas Tersedia Utuh", value: currentSystemData.totalMonthly, color: "#10b981", percent: 100, desc: "Kas tersimpan utuh di kas pengurus (Belum ada pengeluaran)" }]
                      : currentSystemData.allocations.filter((a) => a.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={currentSystemData.totalMonthly === 0 || currentSystemData.totalExpense === 0 ? 0 : 5}
                    dataKey="value"
                  >
                    {(currentSystemData.totalMonthly === 0
                      ? [{ color: "#334155" }]
                      : currentSystemData.totalExpense === 0
                      ? [{ color: "#10b981" }]
                      : currentSystemData.allocations.filter((a) => a.value > 0)
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
                  {currentSystemData.totalExpense === 0 ? "Kas Riil (Utuh)" : "Saldo Kas Tersedia"}
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
                  title={item.desc}
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
