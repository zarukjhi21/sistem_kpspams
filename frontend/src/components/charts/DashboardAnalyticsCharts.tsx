"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  TrendingUp,
  Droplet,
  PieChart as PieIcon,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
  Clock,
  Sparkles,
} from "lucide-react";
import { DEMO_CUSTOMERS, DemoCustomer } from "@/lib/demo-data";
import { apiClient } from "@/lib/api-client";

interface DashboardAnalyticsChartsProps {
  activeKpspamsId: number | null;
  activeKpspamsName?: string;
}

export function DashboardAnalyticsCharts({
  activeKpspamsId,
  activeKpspamsName,
}: DashboardAnalyticsChartsProps) {
  const [mounted, setMounted] = useState(false);
  const [customers, setCustomers] = useState<DemoCustomer[]>([]);

  useEffect(() => {
    setMounted(true);
    const loadData = async () => {
      try {
        const res = await apiClient("/customers?per_page=100");
        if (res?.status === "success" && Array.isArray(res.data)) {
          const mapped: DemoCustomer[] = res.data.map((c: any) => ({
            id: c.id,
            connectionNo: c.connection_no || `SR-${c.id}`,
            name: c.full_name || c.name,
            nik: c.nik || "",
            dusun: c.dusun || "Lemo Baru",
            kpspamsId: Number(c.kpspams_id) || 1,
            kpspamsName: c.kpspams_name || "KPSPAMS Lemo Baru",
            meterSerial: c.meter_serial || "MTR-1001",
            lastReading: Number(c.lastReading) || 0,
            status: c.status || "ACTIVE",
            tariffType: c.tariffType || "Rumah Tangga",
            billingStatus: c.billing_status || "UNPAID",
          }));
          setCustomers(mapped);
          return;
        }
      } catch (err) {
        console.warn("Gagal fetch pelanggan untuk chart, gunakan cache:", err);
      }

      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("kpspams_customers");
        if (saved) {
          try {
            const parsed: DemoCustomer[] = JSON.parse(saved);
            setCustomers(parsed);
            return;
          } catch (e) {
            console.error("Failed to parse kpspams_customers", e);
          }
        }
      }
      setCustomers(DEMO_CUSTOMERS);
    };

    loadData();
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-pulse">
        <div className="lg:col-span-2 h-72 bg-slate-100 rounded-3xl border border-slate-200" />
        <div className="h-72 bg-slate-100 rounded-3xl border border-slate-200" />
      </div>
    );
  }

  // Konteks unit & cakupan wilayah
  const isPhase2Unit = activeKpspamsId === 2 || activeKpspamsId === 3;
  const isLemoBaruScope = activeKpspamsId === null || activeKpspamsId === 1;

  // Pelanggan terdaftar di unit aktif (yang benar-benar sudah diinput di sistem)
  const registeredInUnit = customers.filter((c) =>
    activeKpspamsId === null ? true : c.kpspamsId === activeKpspamsId
  );

  const realCustomerCount = registeredInUnit.length;
  const realPaidCount = registeredInUnit.filter((c) => c.billingStatus === "PAID").length;
  const realUnpaidCount = registeredInUnit.filter((c) => c.billingStatus === "UNPAID").length;

  // Angka total dan irisan donat berdasarkan status pembayaran riil
  const centerNumber = realCustomerCount;
  const centerLabel = "TOTAL SR";
  let complianceData: { name: string; value: number; percent: number; color: string }[] = [];

  if (realCustomerCount === 0) {
    complianceData = [
      {
        name: "Belum Ada Warga Terdata",
        value: 1,
        percent: 100,
        color: "#94a3b8",
      },
    ];
  } else if (realPaidCount === 0) {
    complianceData = [
      {
        name: "Belum Bayar / Siap Ditagih",
        value: realCustomerCount,
        percent: 100,
        color: "#0284c7",
      },
      {
        name: "Lunas Terbayar",
        value: 0,
        percent: 0,
        color: "#10b981",
      },
    ];
  } else {
    complianceData = [
      {
        name: "Belum Bayar / Tertagih",
        value: realUnpaidCount,
        percent: Number(((realUnpaidCount / realCustomerCount) * 100).toFixed(1)),
        color: "#0284c7",
      },
      {
        name: "Lunas Terbayar",
        value: realPaidCount,
        percent: Number(((realPaidCount / realCustomerCount) * 100).toFixed(1)),
        color: "#10b981",
      },
    ];
  }

  // Data Tren Penagihan & Realisasi Kas
  // Sesuai instruksi: Baseline dinolkan karena penagihan perdana dimulai 5 Oktober 2026
  const currentTrend = [
    { month: "Mei", billed: 0, collected: 0, rate: 0, note: "Pra-Digital" },
    { month: "Jun", billed: 0, collected: 0, rate: 0, note: "Pra-Digital" },
    { month: "Jul", billed: 0, collected: 0, rate: 0, note: "Pra-Digital" },
    { month: "Agt", billed: 0, collected: 0, rate: 0, note: "Pra-Digital" },
    { month: "Sep", billed: 0, collected: 0, rate: 0, note: "Pra-Digital" },
    {
      month: "Okt",
      billed: realPaidCount > 0 ? realPaidCount * 25000 : 0,
      collected: realPaidCount > 0 ? realPaidCount * 25000 : 0,
      rate: realPaidCount > 0 ? 100 : 0,
      note: "Pencatatan Meter Mulai 5 Okt",
    },
  ];

  // Data Distribusi Konsumsi Air per Dusun (Jumlah SR dihitung langsung dari warga terdaftar riil)
  const dusunWaterUsage = [
    {
      dusun: "Dusun Lemo Baru",
      usage: 0,
      sr: customers.filter((c) => c.dusun?.toLowerCase().includes("lemo baru")).length,
      system: "Mata Air Gravitasi (0% Listrik)",
      status: "Unit Beroperasi",
      fill: "#0284c7",
      isPilot: true,
    },
    {
      dusun: "Dusun Lemo Tua",
      usage: 0,
      sr: customers.filter((c) => c.dusun?.toLowerCase().includes("lemo tua")).length,
      system: "Sumur Bor Pompa PLN",
      status: "Unit Beroperasi",
      fill: "#0ea5e9",
      isPilot: false,
    },
    {
      dusun: "Dusun Sarampu 1",
      usage: 0,
      sr: customers.filter((c) => c.dusun?.toLowerCase().includes("sarampu")).length,
      system: "Sumur Bor Pompa PLN",
      status: "Unit Beroperasi",
      fill: "#6366f1",
      isPilot: false,
    },
    {
      dusun: "Dusun Pakkandoang",
      usage: 0,
      sr: customers.filter((c) => c.dusun?.toLowerCase().includes("pakkandoang")).length,
      system: "Sumur Bor Pompa PLN",
      status: "Unit Beroperasi",
      fill: "#8b5cf6",
      isPilot: false,
    },
  ];

  const formatRupiah = (val: number) => {
    if (val >= 1000000) {
      return `Rp ${(val / 1000000).toFixed(1)} jt`;
    }
    return `Rp ${val.toLocaleString("id-ID")}`;
  };

  return (
    <div className="space-y-5">
      {/* Header Visual Analytics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-maroon-800" />
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Analisis Visual & Kinerja Keuangan KPSPAMS
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isLemoBaruScope
              ? "Statistik kinerja operasional, iuran warga, dan kepatuhan pembayaran"
              : `Statistik Kinerja Khusus ${activeKpspamsName} • Status: Persiapan Operasional`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isLemoBaruScope ? (
            <>
              <Badge variant="brand" size="sm">
                Lemo Baru Aktif
              </Badge>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md font-semibold hidden sm:inline-flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-600" /> Penagihan Mulai: 5 Okt 2026
              </span>
            </>
          ) : (
            <Badge variant="warning" size="sm">
              Persiapan Operasional
            </Badge>
          )}
        </div>
      </div>

      {/* Warning banner jika memilih unit Tahap 2 */}
      {isPhase2Unit && (
        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>
              <strong>Perhatian:</strong> Unit {activeKpspamsName} sedang dalam tahap persiapan pendataan warga & meteran air di sistem.
            </span>
          </div>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg flex-shrink-0">
            Persiapan
          </span>
        </div>
      )}

      {/* Grid: 2 Charts di Baris Pertama (Tren Keuangan + Donut Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Chart 1: Tren Realisasi Keuangan (Area Chart 2 Kolom) */}
        <Card className="lg:col-span-2 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-brand-maroon-50 text-brand-maroon-800 border border-brand-maroon-200/80">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Tren Realisasi Penerimaan Kasir vs Tagihan Terbit
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Baseline Rp 0 (Clean Slate) • Pencatatan meter & penagihan perdana dimulai 5 Oktober
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-300" />
                  <span className="text-slate-600 font-semibold">Tagihan</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-brand-maroon-800" />
                  <span className="text-brand-maroon-900 font-extrabold">Kas Terkumpul</span>
                </div>
              </div>
            </div>

            {/* Informational cycle note */}
            <div className="mb-3 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200/70 text-sky-900 text-[11px] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <strong>Siklus Penagihan Bulanan:</strong> Setiap tanggal 5 secara serentak.
              </span>
              <span className="font-semibold text-sky-800">
                Pencatatan Lapangan: Mulai 5 Okt 2026
              </span>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-60 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={currentTrend}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#831843" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#831843" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={formatRupiah}
                    domain={[0, 5000000]}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const billedVal = Number(payload[0]?.value || 0);
                        const collectedVal = Number(payload[1]?.value || 0);
                        const d = payload[0]?.payload;
                        return (
                          <div className="bg-slate-900/95 backdrop-blur text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[210px]">
                            <div className="font-black text-amber-400 border-b border-slate-800 pb-1 flex justify-between">
                              <span>Bulan {label} 2026</span>
                              <span>{d?.note || "Periode Aktif"}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center space-x-1.5">
                                <span className="w-2 h-2 rounded-full bg-slate-400" />
                                <span>Tagihan Terbit:</span>
                              </span>
                              <strong className="text-white">Rp {billedVal.toLocaleString("id-ID")}</strong>
                            </div>
                            <div className="flex justify-between items-center text-emerald-300">
                              <span className="flex items-center space-x-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span>Kas Terkumpul:</span>
                              </span>
                              <strong className="text-emerald-400">Rp {collectedVal.toLocaleString("id-ID")}</strong>
                            </div>
                            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                              {label === "Okt"
                                ? "Pencatatan meter & penagihan digital dimulai 5 Oktober 2026"
                                : "Pra-digitalisasi sistem (belum ada transaksi)"}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="billed"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBilled)"
                  />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    stroke="#831843"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCollected)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Metrics Footer */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/50">
              <span className="text-[10px] text-slate-400 block font-medium">Total Sambungan</span>
              <strong className="text-slate-800 font-tabular text-sm">
                {realCustomerCount} SR
              </strong>
              <span className="text-[10px] text-slate-400 block mt-0.5">Warga Terdaftar Aktif</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/50">
              <span className="text-[10px] text-emerald-600 block font-medium">Realisasi Kas Masuk</span>
              <strong className="text-emerald-800 font-tabular text-sm">
                Rp {realPaidCount > 0 ? (realPaidCount * 25000).toLocaleString("id-ID") : "0"}
              </strong>
              <span className="text-[10px] text-emerald-600/80 block mt-0.5">Penerimaan Kas Lunas</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/50">
              <span className="text-[10px] text-amber-700 block font-medium">Kepatuhan Bayar</span>
              <strong className="text-amber-900 font-tabular text-sm">
                {realCustomerCount > 0 ? `${((realPaidCount / realCustomerCount) * 100).toFixed(1)}%` : "0%"}
              </strong>
              <span className="text-[10px] text-amber-700/80 block mt-0.5">{realPaidCount} dari {realCustomerCount} SR Lunas</span>
            </div>
          </div>
        </Card>

        {/* Chart 2: Donut Kepatuhan & Status Sambungan Rumah (1 Kolom) */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/80">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Status Pembayaran Sambungan Rumah
                </h3>
                <p className="text-[11px] text-slate-400">
                  {realCustomerCount} Sambungan Rumah (SR) terdaftar aktif di sistem
                </p>
              </div>
            </div>

            {/* Donut Chart with Center Text */}
            <div className="h-52 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complianceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={complianceData.length > 1 ? 4 : 0}
                    dataKey="value"
                  >
                    {complianceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg border border-slate-800 text-xs">
                            <div className="font-bold flex items-center space-x-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: data.color }}
                              />
                              <span>{data.name}</span>
                            </div>
                            <div className="mt-1 text-slate-300">
                              <strong>{data.value} Sambungan</strong> ({data.percent}%)
                            </div>
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
                <span className="text-2xl font-black text-slate-900 font-tabular">
                  {centerNumber}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                  {centerLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown List Legend */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            {complianceData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-600 font-medium text-[11px] truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <strong className="text-slate-800 font-tabular">{item.value} SR</strong>
                  <span className="text-[10px] text-slate-400 font-mono">({item.percent}%)</span>
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Integrasi Data:</span>
              <span className="font-semibold text-emerald-600">100% Data Riil Terdaftar</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Baris Kedua: Distribusi Konsumsi Air per Dusun (Bar Chart Modern) */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200/80">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Distribusi Konsumsi Debit Air per Dusun (m³)
              </h3>
              <p className="text-[11px] text-slate-400">
                Volume pemakaian air bersih bulan berjalan berdasarkan catatan stand meter petugas
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">Total Volume Terdistribusi:</span>
            <span className="font-black text-cyan-900 bg-cyan-100/70 px-2.5 py-0.5 rounded-lg border border-cyan-200 flex items-center gap-1">
              0 m³
              <span className="text-[10px] font-normal text-cyan-700 hidden sm:inline">
                (Mulai 5 Okt)
              </span>
            </span>
          </div>
        </div>

        {/* Informative notice inside chart */}
        <div className="mb-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600 text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <strong>Catatan Petugas Lapangan:</strong> Stand meter perdana akan mulai dicatat di lapangan
            per 5 Oktober 2026. Angka pemakaian riil saat ini 0 m³ (baseline awal).
          </span>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md hidden md:inline">
            Pilot Lemo Baru Siap Catat
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dusunWaterUsage}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="dusun"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#475569", fontSize: 11, fontWeight: 700 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickFormatter={(val) => `${val} m³`}
                domain={[0, 50]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1">
                        <div className="font-black text-cyan-300 border-b border-slate-800 pb-1 flex justify-between">
                          <span>{d.dusun}</span>
                          <span className="text-[10px] text-amber-400 font-normal">{d.status}</span>
                        </div>
                        <div className="flex justify-between space-x-4 text-slate-300">
                          <span>Volume Air Tercatat:</span>
                          <strong className="text-white font-tabular">{d.usage} m³</strong>
                        </div>
                        <div className="flex justify-between space-x-4 text-slate-300">
                          <span>Sambungan Rumah (SR):</span>
                          <strong className="text-white">{d.sr} SR</strong>
                        </div>
                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                          Sistem: {d.system}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="usage" radius={[8, 8, 0, 0]}>
                {dusunWaterUsage.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dusun Metric Summary Pill Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-2 border-t border-slate-100 text-xs">
          {dusunWaterUsage.map((item, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border ${
                item.isPilot
                  ? "bg-sky-50/70 border-sky-200/80 ring-1 ring-sky-300/40"
                  : "bg-slate-50 border-slate-200/60"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                  <span className="font-bold text-slate-800 text-[11px] truncate">{item.dusun}</span>
                </div>
                {item.isPilot ? (
                  <span className="text-[9px] font-black text-sky-800 bg-sky-200/80 px-1.5 py-0.5 rounded">
                    Pilot Live
                  </span>
                ) : (
                  <span className="text-[9px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                    Tahap 2
                  </span>
                )}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-black text-slate-900 font-tabular">
                  {item.usage} <span className="text-[10px] font-normal text-slate-500">m³</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-medium">{item.sr} SR</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">
                {item.system}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
